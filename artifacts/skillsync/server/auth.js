import { clerkClient, getAuth } from "@clerk/express";
import { Profile, User } from "./models.js";

function getIdentityName(identity) {
  return [identity.firstName, identity.lastName].filter(Boolean).join(" ").trim();
}

async function createAccount(clerkId) {
  const identity = await clerkClient.users.getUser(clerkId);
  const fullName = getIdentityName(identity);
  const email =
    identity.primaryEmailAddress?.emailAddress ||
    identity.emailAddresses?.[0]?.emailAddress ||
    "";

  let user;
  try {
    user = await User.findOneAndUpdate(
      { clerkId },
      { $setOnInsert: { clerkId, fullName, email } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    user = await User.findOne({ clerkId });
  }

  await Profile.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, fullName, email } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return user;
}

export async function requireUser(req, res, next) {
  const clerkId = getAuth(req).userId;
  if (!clerkId) {
    return res.status(401).json({ error: "Sign in to continue." });
  }

  try {
    let user = await User.findOne({ clerkId });
    if (!user) user = await createAccount(clerkId);
    else {
      await Profile.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, fullName: user.fullName, email: user.email } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }

    req.account = user;
    next();
  } catch {
    return res.status(503).json({
      error: "Your workspace could not be loaded. Please try again shortly.",
    });
  }
}