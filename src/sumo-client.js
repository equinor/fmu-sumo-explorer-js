import axios from "axios";

class SumoClient {
  #axios;
  #credential;
  #scope;
  constructor(baseUrl, credential, scope) {
    this.#credential = credential;
    this.#scope = scope;
    this.#axios = axios.create({
      baseURL: baseUrl,
      allowAbsoluteUrls: false,
    });
  }

  async #headers() {
    const token = (await this.#credential.getToken(this.#scope)).token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async get(url, params = {}) {
    console.dir({
      url,
      headers: await this.#headers(),
      params,
    });
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
      headers: await this.#headers,
      params,
    });
  }
}

export default SumoClient;
