import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import jwt from 'jsonwebtoken';

// Lazy-initialized MSAL client (only created when Azure credentials are available)
let msalClient: ConfidentialClientApplication | null = null;

const getMsalClient = () => {
  if (!msalClient) {
    // Only initialize if Azure credentials are provided
    if (!process.env.AZURE_AD_CLIENT_ID || !process.env.AZURE_AD_CLIENT_SECRET || !process.env.AZURE_AD_TENANT_ID) {
      throw new Error('Azure AD credentials not configured');
    }

    const msalConfig: Configuration = {
      auth: {
        clientId: process.env.AZURE_AD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message, containsPii) {
            if (process.env.NODE_ENV === 'development') {
              console.log(message);
            }
          },
          piiLoggingEnabled: false,
          logLevel: 3, // Error
        },
      },
    };

    msalClient = new ConfidentialClientApplication(msalConfig);
  }
  
  return msalClient;
};

// Azure AD OAuth URLs
export const getAuthUrl = () => {
  const client = getMsalClient();
  return client.getAuthCodeUrl({
    scopes: ['User.Read', 'email', 'profile', 'openid'],
    redirectUri: process.env.AZURE_AD_REDIRECT_URI!,
  });
};

// Exchange authorization code for tokens
export const acquireTokenByCode = async (code: string) => {
  const client = getMsalClient();
  return await client.acquireTokenByCode({
    code,
    scopes: ['User.Read', 'email', 'profile', 'openid'],
    redirectUri: process.env.AZURE_AD_REDIRECT_URI!,
  });
};

// Refresh access token
export const acquireTokenByRefreshToken = async (refreshToken: string) => {
  const client = getMsalClient();
  return await client.acquireTokenByRefreshToken({
    refreshToken,
    scopes: ['User.Read', 'email', 'profile', 'openid'],
  });
};

// Extract user profile from ID token
export interface AzureUserProfile {
  oid: string; // Azure object ID
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
}

export const extractUserProfile = (idToken: string): AzureUserProfile | null => {
  try {
    // Decode without verification (Azure has already verified it)
    const decoded = jwt.decode(idToken) as any;
    
    if (!decoded) return null;

    return {
      oid: decoded.oid,
      email: decoded.email || decoded.preferred_username || decoded.upn,
      name: decoded.name,
      given_name: decoded.given_name,
      family_name: decoded.family_name,
      preferred_username: decoded.preferred_username,
    };
  } catch (error) {
    console.error('Error extracting user profile:', error);
    return null;
  }
};

// Verify token expiration
export const isTokenExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) <= new Date();
};
