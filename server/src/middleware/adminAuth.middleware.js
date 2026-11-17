/**
 * Simple admin key authentication for administrative voting actions.
 * The key is configured via the ADMIN_VOTING_KEY environment variable.
 */
export const requireAdmin = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_VOTING_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: "Admin voting key is not configured on the server.",
    });
  }

  if (!adminKey || adminKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. A valid admin key is required.",
    });
  }

  next();
};
