/**
 * Verify a Supabase Auth JWT from an incoming request.
 */

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export interface VerifiedAdmin {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export async function verifyAdmin(
  req: Request,
): Promise<{ admin: VerifiedAdmin; response?: never } | { admin?: never; response: Response }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return {
      response: new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "WWW-Authenticate": "Bearer",
        },
      }),
    };
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return {
      response: new Response(JSON.stringify({ error: "Invalid authorization header" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "WWW-Authenticate": "Bearer",
        },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      response: new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }),
    };
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return {
      response: new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "WWW-Authenticate": "Bearer",
        },
      }),
    };
  }

  return {
    admin: {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata as Record<string, unknown> | undefined,
    },
  };
}
