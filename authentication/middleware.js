import {
  verifyToken,
  createAccessTokenFromRefresh,
  verifyRefreshToken,
} from "./jwt.js";
import pool from "../config/dbconfig.js";

export async function authenticate(req, res, next) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Nếu không có refresh token
  if (!refreshToken) {
    return res.redirect("/?msg=invalid_token");
  }

  // 1 THỬ VERIFY ACCESS TOKEN TRƯỚC
  let accessResult = null;

  if (accessToken) {
    accessResult = verifyToken(accessToken);

    // Nếu access token vẫn hợp lệ → OK
    if (accessResult.valid) {
      req.user = accessResult.payload;
      return next();
    }
  }

  // 2 ACCESS TOKEN KHÔNG HỢP LỆ → THỬ REFRESH TOKEN
  const refreshResult = createAccessTokenFromRefresh(refreshToken);

  if (!refreshResult.success) {
    // Refresh token cũng không hợp lệ
    return res.redirect("/?msg=invalid_token");
  }

  // 3 REFRESH TOKEN OK → TẠO ACCESS TOKEN MỚI
  res.cookie("accessToken", refreshResult.accessToken, {
    httpOnly: true,
    secure: false,
    maxAge: 5 * 60 * 1000, // 5 phút
  });

  // 4 Cấp quyền đi tiếp
  req.user = refreshResult.payload;
  next();
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
      [device_id, result.payload.jti]
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
