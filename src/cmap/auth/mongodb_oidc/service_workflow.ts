import { type Document, BSON } from 'bson';

import { ns } from '../../../utils';
import type { Connection } from '../../connection';
import type { MongoCredentials } from '../mongo_credentials';
import { AuthMechanism } from '../providers';
import type { Workflow } from './workflow';

/**
 * Common behaviour for OIDC device workflows.
 * @internal
 */
export abstract class ServiceWorkflow implements Workflow {
  /**
   * Execute the workflow. Looks for AWS_WEB_IDENTITY_TOKEN_FILE in the environment
   * and then attempts to read the token from that path.
   */
  async execute(connection: Connection, credentials: MongoCredentials): Promise<Document> {
    const token = await this.getToken();
    const command = commandDocument(token);
    return connection.commandAsync(ns(credentials.source), command, undefined);
  }

  /**
   * Get the document to add for speculative authentication.
   */
  async speculativeAuth(): Promise<Document> {
    const token = await this.getToken();
    return { speculativeAuthenticate: commandDocument(token) };
  }

  /**
   * Get the token from the environment or endpoint.
   */
  abstract getToken(): Promise<string>;
}

/**
 * Create the saslStart command document.
 */
export function commandDocument(token: string): Document {
  return {
    saslStart: 1,
    mechanism: AuthMechanism.MONGODB_OIDC,
    payload: BSON.serialize({ jwt: token })
  };
}
