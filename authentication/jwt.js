import jwt from "jsonwebtoken";
import pool from "../config/dbconfig.js";

const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

const expiryTimeAT = process.env.EXPIRYAT;
const expiryTimeRT = process.env.EXPIRYRT;

// AT
export function generateToken(payload, expiresIn = expiryTimeAT) {
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn });

  const decoded = jwt.decode(token);
  const expiredAt = decoded.exp * 1000;

  return { token, expiredAt };
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

//RT
export function generateRefreshToken(payload, expiresIn = expiryTimeRT) {
  const jti = crypto.randomUUID();

  const token = jwt.sign(payload, REFRESH_SECRET_KEY, {
    expiresIn,
    jwtid: jti,
  });

  // Lấy thời gian hết hạn từ token
  const decoded = jwt.decode(token);
  const expiredAt = decoded && decoded.exp ? decoded.exp * 1000 : null;

  return { token, expiredAt, jti };
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET_KEY);
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export async function createAccessTokenFromRefresh(refreshToken) {
  const result = 
  
  verifyRefreshToken(refreshToken);

  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM list_token WHERE jti = ?",
    [result.payload.jti]
  );
  const isUsed = rows.total > 0;

  if (!isUsed) {
    return { success: false, message: "Invalid refresh token" };
  }

  if (!result.valid) {
    return { success: false, message: "Invalid refresh token" };
  }

  // Dữ liệu user trong refresh token
  const payload = {
    username: result.payload.username,
    user_id: result.payload.user_id,
    role: result.payload.role,
    factory: result.payload.factory,
  };

  // Tạo access token mới
  const { token, expiredAt } = generateToken(payload, expiryTimeAT);

  return {
    success: true,
    accessToken: token,
    expiredAt: expiredAt,
    payload: payload,
  };
}
