import axios from "axios";

import assert from "node:assert";

class SumoClient {
  #axios;
  #baseUrl;
  #credential;
  #scope;
  #cachedtoken;
  constructor(baseUrl, credential, scope) {
    this.#credential = credential;
    this.#scope = scope;
    this.#baseUrl = baseUrl;
    this.#axios = axios.create({
      baseURL: baseUrl,
      allowAbsoluteUrls: false,
    });
    this.#cachedtoken = null;
  }

  async #headers() {
    if (
      this.#cachedtoken == null ||
      this.#cachedtoken.expiresOnTimestamp < Date.now() - 1000
    ) {
      this.#cachedtoken = await this.#credential.getToken(this.#scope);
    }

    const token = this.#cachedtoken.token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async get(url, params = {}) {
    return this.#axios.get(url, {
      headers: await this.#headers(),
      params,
    });
  }

  async post(url, data, params) {
    return this.#axios.post(url, data, {
      headers: await this.#headers(),
      params,
    });
  }

  async put(url, data, params) {
    return this.#axios.put(url, data, {
      headers: await this.#headers(),
      params,
    });
  }

  async delete(url, params) {
    return this.#axios.delete(url, {
      headers: await this.#headers(),
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
