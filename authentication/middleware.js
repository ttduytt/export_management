import { verifyToken, createAccessTokenFromRefresh } from "./jwt.js";

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
  const refreshResult =  createAccessTokenFromRefresh(refreshToken);

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
