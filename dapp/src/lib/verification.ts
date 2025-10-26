import { detectConcordiumProvider } from "@concordium/browser-wallet-api-helpers";
import { VerifiablePresentation } from "@concordium/web-sdk";

interface ChallengeResponse {
  challenge: string;
}

/**
 * Fetch the statement to prove from the backend
 * This follows the same pattern as the gallery example
 */
export async function getStatement(verifier: string): Promise<any> {
  console.log("Getting statement from:", `${verifier}/statement`);
  const response = await fetch(`${verifier}/statement`, { method: "get" });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Statement request failed:", response.status, errorText);
    throw new Error(`Failed to get statement: ${response.status} ${errorText}`);
  }

  const body = await response.json();
  console.log("Statement response:", body);

  const credentialStatement = {
    idQualifier: {
      type: "cred",
      // We allow all identity providers on mainnet and on testnet.
      // This list is longer than necessary to include all current/future
      // identity providers on mainnet and testnet.
      // This list should be updated to only include the identity providers that you trust.
      issuers: [0, 1, 2, 3, 4, 5, 6, 7],
    },
    statement: body, // body is already parsed JSON, no need to parse again
  };

  return credentialStatement;
}

/**
 * Get a challenge from the backend for name verification
 */
export async function getVerificationChallenge(
  verifier: string,
  accountAddress: string
): Promise<string> {
  const response = await fetch(
    `${verifier}/challenge?address=${accountAddress}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get challenge: ${response.status} ${errorText}`);
  }

  const body = (await response.json()) as ChallengeResponse;
  return body.challenge;
}

/**
 * Extract name from verifiable presentation
 */
export function extractNameFromPresentation(
  presentation: VerifiablePresentation
): string {
  try {
    // Extract firstName and lastName from the verifiable credential
    const credential = presentation.verifiableCredential?.[0];
    if (!credential) {
      throw new Error("No verifiable credential found in presentation");
    }

    const proofValue = credential.credentialSubject?.proof?.proofValue;
    if (!proofValue || !Array.isArray(proofValue)) {
      throw new Error("No proof values found in credential");
    }

    let firstName = "";
    let lastName = "";

    // Extract firstName and lastName from proof values
    for (const proof of proofValue) {
      if (proof.type === "RevealAttribute") {
        if (proof.attribute) {
          // The attribute name is not directly available, but we can infer from the order
          // First attribute is typically firstName, second is lastName
          const attributeValue = String(proof.attribute);
          if (!firstName) {
            firstName = attributeValue;
          } else if (!lastName) {
            lastName = attributeValue;
          }
        }
      }
    }

    if (!firstName || !lastName) {
      throw new Error(
        "Could not extract both first and last name from presentation"
      );
    }

    return `${firstName} ${lastName}`;
  } catch (error) {
    console.error("Error extracting name from presentation:", error);
    throw new Error(
      `Failed to extract name: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Authorize with the backend using name verification
 */
export async function authorizeWithName(
  verifier: string,
  presentation: VerifiablePresentation,
  userName: string
): Promise<string> {
  const response = await fetch(`${verifier}/prove`, {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      "X-Verification-Type": "name",
      "X-User-Name": userName,
    }),
    body: JSON.stringify({ presentation, userName }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to authorize: ${response.status} ${errorText}`);
  }

  const body = (await response.json()) as string;
  if (body) {
    return body;
  }
  throw new Error("Unable to authorize");
}

/**
 * Complete name verification process
 */
export async function verifyUserIdentity(
  verifier: string,
  account: string
): Promise<{ authToken: string; userName: string }> {
  try {
    const provider = await detectConcordiumProvider();
    const challenge = await getVerificationChallenge(verifier, account);
    const statement = await getStatement(verifier);

    // Request verifiable presentation from the wallet
    const presentation = await provider.requestVerifiablePresentation(
      challenge,
      [statement]
    );

    // Extract name from the presentation
    const userName = extractNameFromPresentation(presentation);

    // Authorize with the backend
    const authToken = await authorizeWithName(verifier, presentation, userName);

    return { authToken, userName };
  } catch (error) {
    console.error("Verification error:", error);
    throw new Error(
      `Verification failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
