import { z } from "zod";

// generate_token() in the database produces 32 random bytes as 64 hex characters
export const MANAGE_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export const manageTokenSchema = z
  .string()
  .regex(MANAGE_TOKEN_PATTERN, "This booking link is not valid.");
