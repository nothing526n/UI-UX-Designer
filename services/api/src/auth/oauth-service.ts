export interface OAuthUserProfile {
  provider: "google" | "github";
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  hostedDomain?: string;
}

export class OAuthService {
  private googleClientId: string | undefined;
  private googleClientSecret: string | undefined;
  private googleRedirectUri: string;
  private googleHostedDomain: string | undefined;

  private githubClientId: string | undefined;
  private githubClientSecret: string | undefined;
  private githubRedirectUri: string;

  constructor() {
    this.googleClientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.googleRedirectUri =
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/v1/auth/google/callback";
    this.googleHostedDomain = process.env.GOOGLE_HOSTED_DOMAIN; // e.g., 'company.com'

    this.githubClientId = process.env.GITHUB_CLIENT_ID;
    this.githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.githubRedirectUri =
      process.env.GITHUB_REDIRECT_URI || "http://localhost:4000/api/v1/auth/github/callback";
  }

  /**
   * Google Workspace OAuth 2.0 Authorization URL
   */
  public getGoogleAuthUrl(state: string = "default"): string {
    const clientId = this.googleClientId || "mock_google_client_id";
    const base = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.googleRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
      prompt: "select_account",
    });

    if (this.googleHostedDomain) {
      params.append("hd", this.googleHostedDomain);
    }

    return `${base}?${params.toString()}`;
  }

  /**
   * Handle Google Authorization Code Callback
   */
  public async handleGoogleCallback(code: string): Promise<OAuthUserProfile> {
    // If live credentials configured, execute HTTP exchange
    if (this.googleClientId && this.googleClientSecret) {
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: this.googleClientId,
            client_secret: this.googleClientSecret,
            redirect_uri: this.googleRedirectUri,
            grant_type: "authorization_code",
          }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(tokenData.error_description || "Google token exchange failed");
        }

        const userinfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await userinfoRes.json();

        // Enforce corporate domain restriction if specified
        if (this.googleHostedDomain && profile.hd !== this.googleHostedDomain) {
          throw new Error(`Unauthorized domain. Must belong to ${this.googleHostedDomain}`);
        }

        return {
          provider: "google",
          providerId: profile.sub,
          email: profile.email,
          name: profile.name || profile.email.split("@")[0],
          avatarUrl: profile.picture,
          hostedDomain: profile.hd,
        };
      } catch (err: any) {
        console.warn("[OAuth] Google exchange error:", err.message);
        throw err;
      }
    }

    // Mock/Testing fallback profile for dev environments
    const mockEmail = code.includes("@") ? code : "alex.vance@apex-logistics.com";
    return {
      provider: "google",
      providerId: `google_${Date.now()}`,
      email: mockEmail,
      name: "Alex Vance (Google Workspace)",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      hostedDomain: this.googleHostedDomain || "apex-logistics.com",
    };
  }

  /**
   * GitHub OAuth 2.0 Authorization URL
   */
  public getGitHubAuthUrl(state: string = "default"): string {
    const clientId = this.githubClientId || "mock_github_client_id";
    const base = "https://github.com/login/oauth/authorize";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.githubRedirectUri,
      scope: "read:user user:email",
      state,
    });

    return `${base}?${params.toString()}`;
  }

  /**
   * Handle GitHub Authorization Code Callback
   */
  public async handleGitHubCallback(code: string): Promise<OAuthUserProfile> {
    if (this.githubClientId && this.githubClientSecret) {
      try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: this.githubClientId,
            client_secret: this.githubClientSecret,
            code,
            redirect_uri: this.githubRedirectUri,
          }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          throw new Error(tokenData.error_description || "GitHub token exchange failed");
        }

        const userRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "AI-UI-UX-Platform",
          },
        });
        const user = await userRes.json();

        // Fetch emails to get primary verified email
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "AI-UI-UX-Platform",
          },
        });
        const emails = await emailsRes.json();
        const primaryEmail = emails.find((e: any) => e.primary)?.email || user.email || `${user.login}@github.local`;

        return {
          provider: "github",
          providerId: String(user.id),
          email: primaryEmail,
          name: user.name || user.login,
          avatarUrl: user.avatar_url,
        };
      } catch (err: any) {
        console.warn("[OAuth] GitHub exchange error:", err.message);
        throw err;
      }
    }

    return {
      provider: "github",
      providerId: `github_${Date.now()}`,
      email: "engineer@github.local",
      name: "Octocat Engineer",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
    };
  }

  public getStatus() {
    return {
      google: {
        configured: !!(this.googleClientId && this.googleClientSecret),
        clientId: this.googleClientId ? `${this.googleClientId.substring(0, 12)}...` : "not_set",
        hostedDomainEnforced: this.googleHostedDomain || null,
      },
      github: {
        configured: !!(this.githubClientId && this.githubClientSecret),
        clientId: this.githubClientId ? `${this.githubClientId.substring(0, 12)}...` : "not_set",
      },
    };
  }
}

export const oauthService = new OAuthService();
