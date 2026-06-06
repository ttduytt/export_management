import {
  verifyToken,
  createAccessTokenFromRefresh,
  verifyRefreshToken,
} from "./jwt.js";
import pool from "../config/dbconfig.js";

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

  const refreshResult = createAccessTokenFromRefresh(refreshToken);

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
      const result = await createAccessTokenFromRefresh(refreshToken);
      // REFRESH TOKEN OK → TẠO ACCESS TOKEN MỚI
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 5 * 60 * 1000, // 5 phút
      });
      return res.redirect("/delivery");
    }

    return next();
  } catch (err) {
    console.log(err);
    return next();
  }
}
