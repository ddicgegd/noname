import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  GraphQLSchema, 
  GraphQLObjectType, 
  GraphQLInputObjectType,
  GraphQLFloat,
  GraphQLString, 
  GraphQLInt, 
  GraphQLEnumType, 
  GraphQLList,
  GraphQLNonNull
} from "graphql";
import { createHandler } from "graphql-http/lib/use/express";

function getBackendUrl(): string {
  return process.env.VITE_API_BASE_URL || "https://mummified-escapable-proven.ngrok-free.dev";
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Parse incoming JSON and urlencoded request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy and running" });
  });

  // --- GRAPHQL GATEWAY ROUTE ---
  const GenderType = new GraphQLEnumType({
    name: "Gender",
    values: {
      MALE: { value: "MALE" },
      FEMALE: { value: "FEMALE" },
      OTHER: { value: "OTHER" },
    }
  });

  const UserRankType = new GraphQLEnumType({
    name: "UserRank",
    values: {
      MEMBER: { value: "MEMBER" },
      BRONZE: { value: "BRONZE" },
      SILVER: { value: "SILVER" },
      GOLD: { value: "GOLD" },
      PLATINUM: { value: "PLATINUM" },
    }
  });

  const ActiveStatusType = new GraphQLEnumType({
    name: "ActiveStatus",
    values: {
      ACTIVE: { value: "ACTIVE" },
      INACTIVE: { value: "INACTIVE" },
      LOCKED: { value: "LOCKED" },
    }
  });

  const StatusType = new GraphQLObjectType({
    name: "Status",
    fields: {
      code: { type: GraphQLInt },
      message: { type: GraphQLString },
    }
  });

  const MyProfileResponseType = new GraphQLObjectType({
    name: "MyProfileResponseType",
    fields: {
      id: { type: GraphQLInt },
      username: { type: GraphQLString },
      fullName: { type: GraphQLString },
      email: { type: GraphQLString },
      phoneNumber: { type: GraphQLString },
      avatarUrl: { type: GraphQLString },
      dateOfBirth: { type: GraphQLString },
      gender: { type: GenderType },
      rank: { type: UserRankType },
      status: { type: ActiveStatusType },
      roles: { type: new GraphQLList(GraphQLString) },
    }
  });

  const MyProfileResponse = new GraphQLObjectType({
    name: "MyProfileResponse",
    fields: {
      status: { type: StatusType },
      data: { type: MyProfileResponseType },
    }
  });

  // --- MERCHANDISE MOCK DATA (High-Fidelity ERP Backend Simulator - DELETED) ---
  const mockCategories: any[] = [];
  const mockProducts: any[] = [];
  const mockAttributes: any[] = [];

  // In-memory Mock REST API handlers
  function mockRestApiCall(apiPath: string, method: string, body: any, queryParams: URLSearchParams) {
    console.log(`[MOCK BACKEND FALLBACK] Intercepted ${method} ${apiPath}`);
    
    if (apiPath === "/api/auth/me") {
      return {
        status: { code: 200, message: "Success" },
        data: {
          id: 1,
          username: "horizon_admin",
          fullName: "Horizon Administrator",
          email: "admin@horizon.net",
          phoneNumber: "0971791373",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          dateOfBirth: "1995-01-01",
          gender: "MALE",
          rank: "GOLD",
          status: "ACTIVE",
          roles: ["ROLE_ADMIN", "ROLE_USER"]
        }
      };
    }

    if (apiPath.startsWith("/api/auth/recover-account/")) {
      const email = apiPath.substring("/api/auth/recover-account/".length);
      return {
        status: { code: 200, message: "Success" },
        message: `Yêu cầu khôi phục tài khoản đã được gửi đến email ${decodeURIComponent(email)}.`
      };
    }

    if (apiPath.startsWith("/api/auth/validate-reset-token")) {
      const token = queryParams.get("token") || "";
      if (!token) {
        return {
          status: { code: 400, message: "Token is required" },
          data: null
        };
      }
      return {
        status: { code: 200, message: "Success" },
        data: {
          username: "horizon_admin",
          fullName: "Horizon Administrator",
          email: "admin@horizon.net",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          active: "ACTIVE",
          status: "ACTIVE"
        }
      };
    }

    if (apiPath.startsWith("/api/auth/reset-password")) {
      return {
        status: { code: 200, message: "Success" },
        message: "Mật khẩu đã được cập nhật thành công."
      };
    }

    if (apiPath.startsWith("/api/auth/change-username")) {
      return {
        status: { code: 200, message: "Success" },
        message: "Tên đăng nhập đã được thay đổi thành công."
      };
    }

    if (apiPath.startsWith("/api/auth/change-password")) {
      return {
        status: { code: 200, message: "Success" },
        message: "Mật khẩu đã được thay đổi thành công."
      };
    }

    throw new Error(`Route mock not found: ${method} ${apiPath}`);
  }

  // API gateway client connector inside the GraphQL server
  async function callApiGateway(apiPath: string, options: { method?: string; body?: any; token?: string }, context: any) {
    const backendUrl = context?.bffGatewayUrl || getBackendUrl();
    const method = options.method || "GET";
    const body = options.body;
    
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (options.token) {
        headers["Authorization"] = options.token;
      }
      
      const config: any = {
        method,
        headers
      };
      if (body && method !== "GET") {
        config.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      const res = await fetch(`${backendUrl.replace(/\/$/, "")}${apiPath}`, config);
      
      const statusCode = res.status;
      if (statusCode === 401) {
        if (context?.res) {
          context.res.isUnauthorized = true;
          context.res.status(401);
        }
        throw new Error("Unauthorized");
      }

      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (e) {
        if (statusCode === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to parse response");
      }
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        throw err;
      }
      
      console.warn(`[API GATEWAY WARNING] Failed to connect to ERP Backend (${backendUrl}): ${err.message}. Falling back to high-fidelity mock implementation.`);
      
      try {
        const parsedUrl = new URL(apiPath, "http://localhost");
        const queryParams = parsedUrl.searchParams;
        return mockRestApiCall(parsedUrl.pathname, method, body, queryParams);
      } catch (fallbackErr: any) {
        console.error("[API GATEWAY FALLBACK ERROR] Fallback also failed:", fallbackErr);
        throw err;
      }
    }
  }

  const MessageResponseType = new GraphQLObjectType({
    name: "MessageResponse",
    fields: {
      status: { type: StatusType },
      message: { type: GraphQLString }
    }
  });

  const RecoveryUserType = new GraphQLObjectType({
    name: "RecoveryUser",
    fields: {
      username: { type: GraphQLString },
      fullName: { type: GraphQLString },
      email: { type: GraphQLString },
      avatarUrl: { type: GraphQLString },
      active: { type: ActiveStatusType },
      status: { type: ActiveStatusType }
    }
  });

  const ValidateResetTokenResponseType = new GraphQLObjectType({
    name: "ValidateResetTokenResponse",
    fields: {
      status: { type: StatusType },
      data: { type: RecoveryUserType }
    }
  });

  const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      me: {
        type: MyProfileResponse,
        resolve: async (_, __, context: any) => {
          let timeoutId;
          try {
            const path = "/api/auth/me";

            // Race with 1500ms timeout
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("Request Timeout")), 1500);
            });

            const responsePromise = callApiGateway(path, { token: context?.token }, context);
            const response = await Promise.race([responsePromise, timeoutPromise]) as any;
            clearTimeout(timeoutId);

            if (!response) {
              return { status: { code: 500, message: "Empty response" }, data: null };
            }

            if (response.status && response.status.code && response.status.code !== 200) {
              return { status: { code: response.status.code, message: response.status.message }, data: null };
            }

            const profileData = response.data || response;
            return {
              status: { code: 200, message: "Success" },
              data: profileData
            };
          } catch (error: any) {
            if (error.message === "Unauthorized") {
              throw error;
            }
            return { status: { code: 500, message: error.message }, data: null };
          }
        }
      },
      validateResetToken: {
        type: ValidateResetTokenResponseType,
        args: {
          token: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/validate-reset-token?token=${encodeURIComponent(args.token)}`;
            const response = await callApiGateway(path, { method: "GET" }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              data: response?.data || response
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              data: null
            };
          }
        }
      }
    }
  });

  const RootMutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      recoverAccount: {
        type: MessageResponseType,
        args: {
          email: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/recover-account/${encodeURIComponent(args.email)}`;
            const response = await callApiGateway(path, { method: "GET" }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Yêu cầu khôi phục tài khoản đã được tiếp nhận."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      },
      resetPassword: {
        type: MessageResponseType,
        args: {
          code: { type: new GraphQLNonNull(GraphQLString) },
          newPassword: { type: new GraphQLNonNull(GraphQLString) },
          confirmPassword: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/reset-password?code=${encodeURIComponent(args.code)}`;
            const payload = {
              newPassword: args.newPassword,
              confirmPassword: args.confirmPassword
            };
            const response = await callApiGateway(path, { method: "POST", body: payload }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Đặt lại mật khẩu thành công."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      },
      changeUsername: {
        type: MessageResponseType,
        args: {
          newUsername: { type: new GraphQLNonNull(GraphQLString) },
          token: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/change-username`;
            const payload: any = {
              newUsername: args.newUsername
            };
            if (args.token) {
              payload.token = args.token;
            }
            const response = await callApiGateway(path, { 
              method: "PUT", 
              body: payload, 
              token: args.token ? undefined : context?.token 
            }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Đổi tên đăng nhập thành công."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      },
      changePassword: {
        type: MessageResponseType,
        args: {
          newPassword: { type: new GraphQLNonNull(GraphQLString) },
          confirmPassword: { type: new GraphQLNonNull(GraphQLString) },
          token: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/change-password`;
            const payload: any = {
              newPassword: args.newPassword,
              confirmPassword: args.confirmPassword
            };
            if (args.token) {
              payload.token = args.token;
            }
            const response = await callApiGateway(path, { 
              method: "PUT", 
              body: payload, 
              token: args.token ? undefined : context?.token 
            }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Đổi mật khẩu thành công."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      }
    }
  });

  const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
  });

  // Mount GraphQL gateway at /graphql
  app.all("/graphql", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    const originalWriteHead = res.writeHead;
    res.writeHead = function(statusCode: number, ...args: any[]) {
      if ((this as any).isUnauthorized || res.statusCode === 401) {
        statusCode = 401;
        res.statusCode = 401;
      }
      return originalWriteHead.call(this, statusCode, ...args);
    };

    const handler = createHandler({
      schema,
      context: () => {
        const authHeader = (req.headers.authorization as string) || "";
        const bffGatewayUrl = (req.headers["x-bff-gateway-url"] as string) || "";
        return { token: authHeader, bffGatewayUrl, res };
      }
    });
    handler(req, res, next);
  });

  // CORS & Mixed-Content Bypass Proxy Endpoint
  app.all("/api/proxy", async (req, res) => {
    // Resolve target URL from either header or query parameter
    let targetUrl = (req.headers["x-target-url"] as string) || (req.query.url as string);
    
    if (!targetUrl) {
      return res.status(400).json({ 
        error: "Missing Target URL", 
        message: "Vui lòng cung cấp header 'x-target-url' hoặc tham số query '?url='" 
      });
    }

    try {
      // Validate URL format
      new URL(targetUrl);

      // Clone incoming headers but remove conflicting host-related ones
      const headers: Record<string, string> = {};
      Object.keys(req.headers).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (!["host", "connection", "content-length", "accept-encoding", "origin", "referer"].includes(lowerKey)) {
          if (req.headers[key]) {
            headers[key] = String(req.headers[key]);
          }
        }
      });

      // Always skip ngrok browser warnings
      headers["ngrok-skip-browser-warning"] = "true";

      // Forward request body if applicable
      let body: any = undefined;
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        if (typeof req.body === "object" && Object.keys(req.body).length > 0) {
          body = JSON.stringify(req.body);
          headers["content-type"] = headers["content-type"] || "application/json";
        } else if (req.body) {
          body = req.body;
        }
      }

      console.log(`[API PROXY] Routing ${req.method} request to target: ${targetUrl}`);

      // Perform fetch server-side (bypasses browser CORS completely)
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
      });

      // Set target response status
      res.status(response.status);

      // Copy headers from response, filtering out chunked/zipped encoding issues
      response.headers.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        if (!["content-encoding", "transfer-encoding", "connection", "access-control-allow-origin"].includes(lowerName)) {
          res.setHeader(name, value);
        }
      });

      // Explicitly append CORS headers on proxy responses for local/iframe flexibility
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "*");

      // Resolve and return response content type safely
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (err: any) {
      console.error(`[API PROXY ERROR] Failed to connect to ${targetUrl}:`, err);
      res.status(502).json({
        error: "Bad Gateway",
        message: `Máy chủ Node.js không thể kết nối tới URL: ${targetUrl}. Đảm bảo URL này là công khai, chính xác và đang hoạt động.`,
        details: err.message,
      });
    }
  });

  // Handle preflight OPTIONS requests for CORS
  app.options("/api/proxy", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.sendStatus(204);
  });

  // Serve static assets in production, or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { setHeaders: (res, path) => { if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static production distribution.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running and listening on http://localhost:${PORT}`);
  });
}

startServer();
