import {
  verifyToken,
  createAccessTokenFromRefresh,
  verifyRefreshToken,
} from "./jwt.js";
import pool from "../config/dbconfig.js";

const menuToUrl = {
  delivery: "/delivery",
  scanpallet: "/scanpallet",
  translations: "/translations",
  history: "/deliveryHistory",
  management: "/management",
  user: "/user",
  roles: "/roles",
  rolemenus: "/role-menus"
};

export async function getRedirectUrlForRole(role) {
  let firstMenuCode = null;
  let conn;
  try {
    conn = await pool.getConnection();
    if (role === "ADMIN") {
      const menuRows = await conn.query("SELECT menu_code FROM menus ORDER BY menu_code LIMIT 1");
      if (menuRows.length > 0) firstMenuCode = menuRows[0].menu_code;
    } else {
      const menuRows = await conn.query("SELECT menu_code FROM role_menu_permissions WHERE role_name = ? ORDER BY menu_code LIMIT 1", [role]);
      if (menuRows.length > 0) firstMenuCode = menuRows[0].menu_code;
    }
  } catch (err) {
    console.error("Error fetching redirect URL:", err);
  } finally {
    if (conn) conn.release();
  }
  return firstMenuCode ? (menuToUrl[firstMenuCode] || "/delivery") : "/delivery";
}

export async function authenticate(req, res, next) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.redirect("/?msg=invalid_token");
  }

  let accessResult = null;

  if (accessToken) {
    accessResult = verifyToken(accessToken);
    if (accessResult.valid) {
      req.user = accessResult.payload;
      return await checkUserStatus(req, res, next); // ← đổi next() thành này
    }
  }

  const refreshResult = await createAccessTokenFromRefresh(refreshToken);

  if (!refreshResult.success) {
    return res.redirect("/?msg=invalid_token");
  }

  res.cookie("accessToken", refreshResult.accessToken, {
    httpOnly: true,
    secure: false,
    maxAge: 5 * 60 * 1000,
  });

  req.user = refreshResult.payload;
  return await checkUserStatus(req, res, next); // ← đổi next() thành này
}

// ─── Kiểm tra status user trong DB ───────────────────────────────────────────
async function checkUserStatus(req, res, next) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT status FROM user WHERE user_name = ?",
      [req.user.username],
    );

    if (!rows.length || rows[0].status?.toUpperCase() === "INACTIVE") {
      return res.redirect("/home");
    }

    next();
  } catch (err) {
    console.error("Error checking user status:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
}

export async function checkRememberLogin(req, res, next) {
  const refreshToken = req.cookies.refreshToken;
  const device_id = req.cookies.device_id;

  if (!refreshToken || !device_id) {
    return next();
  }

  try {
    // Verify refresh token
    const result = verifyRefreshToken(refreshToken);

    if (!result.valid) {
      return next();
    }

    // Kiểm tra refresh token còn hợp lệ trong DB không
    const rows = await pool.query(
      "SELECT user_id FROM list_token WHERE device_id = ? AND jti = ?",
      [device_id, result.payload.jti],
    );

    if (rows.length > 0) {
      const resultToken = await createAccessTokenFromRefresh(refreshToken);
      // REFRESH TOKEN OK → TẠO ACCESS TOKEN MỚI
      res.cookie("accessToken", resultToken.accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 5 * 60 * 1000, // 5 phút
      });
      const redirectUrl = await getRedirectUrlForRole(result.payload.role);
      return res.redirect(redirectUrl);
    }

    return next();
  } catch (err) {
    console.log(err);
    return next();
  }
}

export function checkMenuAccess(menuCode) {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.redirect("/?msg=no_permission");
    }
    
    // ADMIN luôn có quyền
    if (req.user.role === "ADMIN") {
      return next();
    }

    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT 1 FROM role_menu_permissions WHERE role_name = ? AND menu_code = ?",
        [req.user.role, menuCode]
      );
      if (rows.length > 0) {
        return next();
      } else {
        return res.redirect("/?msg=no_permission");
      }
    } catch (err) {
      console.error("Error checking menu access:", err);
      return res.redirect("/?msg=error");
    } finally {
      if (conn) conn.release();
    }
  };
}
