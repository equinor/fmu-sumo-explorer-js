import axios from "axios";
import axiosRetry from "axios-retry";

import assert from "node:assert";

/** Simple wrapper for making HTTP requests to a Sumo instance. */
class SumoClient {
  #axios;
  #baseUrl;
  #credential;
  #scope;
  #cachedtoken;
  /**
   * Constructor
   * @param {string} baseUrl The base url for the Sumo instance.
   * @param {WorkloadIdentityCredential|InteractiveBrowserCredential|EnvironmentCredential} credential
   * @param {string} scope
   *
   * @returns {SumoClient}
   */
  constructor(baseUrl, credential, scope) {
    this.#credential = credential;
    this.#scope = scope;
    this.#baseUrl = baseUrl;
    this.#axios = axios.create({
      baseURL: baseUrl,
      allowAbsoluteUrls: false,
    });
    this.#cachedtoken = null;
    axiosRetry(this.#axios, {
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429,
    });
  }

  /**
   * Add authorization to headers.
   * @async
   * @private
   * @param {Object} headers_in: key/value map of http headers
   * @returns {Object}: key/value map of http headers
   */
  async #headers(headers_in) {
    if (this.#cachedtoken == null || this.#cachedtoken.expiresOnTimestamp < Date.now() - 1000) {
      this.#cachedtoken = await this.#credential.getToken(this.#scope);
    }

    const token = this.#cachedtoken.token;
    return {
      ...headers_in,
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Perform HTTP GET.
   * @param {string} url request url (relative to baseUrl)
   * @param {Object} params key/value map of parameters
   * @param {Object} config additional settings for request (e.g, headers)
   */
  async get(url, params = {}, config = {}) {
    return this.#axios.get(url, {
      headers: await this.#headers(config.headers),
      params,
    });
  }

  /**
   * Perform HTTP POST.
   * @param {string} url request url (relative to baseUrl)
   * @param {} data upload body
   * @param {Object} params key/value map of parameters
   * @param {Object} config additional settings for request (e.g, headers)
   */
  async post(url, data, params = {}, config = {}) {
    return this.#axios.post(url, data, {
      headers: await this.#headers(config.headers),
      params,
    });
  }

  /**
   * Perform HTTP PUT.
   * @param {string} url request url (relative to baseUrl)
   * @param {} data upload body
   * @param {Object} params key/value map of parameters
   * @param {Object} config additional settings for request (e.g, headers)
   */
  async put(url, data, params = {}, config = {}) {
    return this.#axios.put(url, data, {
      headers: await this.#headers(config.headers),
      params,
    });
  }

  /**
   * Perform HTTP PATCH.
   * @param {string} url request url (relative to baseUrl)
   * @param {} data upload body
   * @param {Object} params key/value map of parameters
   * @param {Object} config additional settings for request (e.g, headers)
   */
  async patch(url, data, params = {}, config = {}) {
    return this.#axios.patch(url, data, {
      headers: await this.#headers(config.headers),
      params,
    });
  }

  /**
   * Perform HTTP DELETE.
   * @param {string} url request url (relative to baseUrl)
   * @param {Object} params key/value map of parameters
   * @param {Object} config additional settings for request (e.g, headers)
   */
  async delete(url, params, config = {}) {
    return this.#axios.delete(url, {
      headers: await this.#headers(config.headers),
      params,
    });
  }

  _get_retry_details(resp) {
    assert(resp.status == 202, "Incorrect status code: expected 202");
    const location = resp.headers.location;
    assert(location != undefined, "Missing header: Location");
    assert(location.startsWith(this.#baseUrl));
    const retry_after = resp.headers["retry-after"];
    assert(retry_after != undefined, "Missing header: Retry-After");
    const rel_loc = location.slice(this.#baseUrl.length);
    const retry_after_int = parseInt(retry_after, 10);
    return [rel_loc, retry_after_int];
  }

  async poll(response_in, timeout = null) {
    let [location, retry_after] = this._get_retry_details(response_in);
    const expiry = timeout && new Date(Date.now() + timeout * 1000);
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, retry_after * 1000));
      const response = await this.get(location);
      if (response.status != 202) {
        return response;
      }
      if (expiry && Date.now() > expiry) {
        throw "No response within specified timeout.";
      }
      [location, retry_after] = this._get_retry_details(response);
    }
  }
}

export default SumoClient;
