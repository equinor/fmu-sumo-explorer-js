import { PublicClientApplication } from "@azure/msal-browser";

export class BrowserMsalCredential {
  constructor({ clientId, tenantId }) {
    this.instance = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`
      },
      cache: {
        cacheLocation: "localStorage"
      }
    });
  }

  async login(scopes) {
    const accounts = this.instance.getAllAccounts();

    if (accounts.length === 1) {
      this.account = accounts[0];
      return;
    }

    // interactive popup if needed
    const result = await this.instance.loginPopup({ scopes });
    this.account = result.account;
  }

  async getToken(scopes) {
    if (!this.account) {
      await this.login(scopes);
    }

    try {
      const res = await this.instance.acquireTokenSilent({
        account: this.account,
        scopes
      });
      return {
        token: res.accessToken,
        expiresOnTimestamp: res.expiresOn.getTime()
      };
    } catch (_) {
      const res = await this.instance.acquireTokenPopup({ scopes });
      return {
        token: res.accessToken,
        expiresOnTimestamp: res.expiresOn.getTime()
      };
    }
  }
}