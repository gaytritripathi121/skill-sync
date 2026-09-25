import { Router } from "express";
import mongoose from "mongoose";
import { requireUser } from "./auth.js";
import {
  InterviewTopic,
  JobApplication,
  Notification,
  Profile,
  Project,
  Roadmap,
  Skill,
  User,
} from "./models.js";

const router = Router();
router.use(requireUser);

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const resourceRules = {
  skills: {
    model: Skill,
    label: "skill",
    required: ["name"],
    fields: {
      name: { type: "string", max: 100 },
      category: { type: "string", max: 80 },
      proficiency: {
        type: "enum",
        values: ["beginner", "working", "advanced", "expert"],
      },
      experience: { type: "string", max: 120 },
    },
  },
  projects: {
    model: Project,
    label: "project",
    required: ["name"],
    fields: {
      name: { type: "string", max: 120 },
      description: { type: "string", max: 2000 },
      technologies: { type: "stringArray", max: 20, itemMax: 60 },
      demoUrl: { type: "string", max: 500 },
      repositoryUrl: { type: "string", max: 500 },
    },
  },
  applications: {
    model: JobApplication,
    label: "application",
    required: ["company", "role"],
    fields: {
      company: { type: "string", max: 120 },
      role: { type: "string", max: 120 },
      location: { type: "string", max: 120 },
      status: {
        type: "enum",
        values: ["applied", "screening", "interview", "offer", "rejected"],
      },
      appliedAt: { type: "date" },
      jobUrl: { type: "string", max: 500 },
      notes: { type: "string", max: 3000 },
    },
  },
  "interview-topics": {
    model: InterviewTopic,
    label: "interview topic",
    required: ["topic"],
    fields: {
      topic: { type: "string", max: 160 },
      progress: {
        type: "enum",
        values: ["not-started", "in-progress", "ready"],
      },
      notes: { type: "string", max: 3000 },
    },
  },
  roadmaps: {
    model: Roadmap,
    label: "roadmap",
    required: ["name"],
    fields: {
      name: { type: "string", max: 120 },
      goal: { type: "string", max: 300 },
      description: { type: "string", max: 2000 },
      active: { type: "boolean" },
      milestones: { type: "milestones", max: 40 },
    },
  },
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateString(value, key, rule) {
  if (typeof value !== "string") {
    throw new RequestError(400, `${key} must be text.`);
  }
  const cleaned = value.trim();
  if (cleaned.length > rule.max) {
    throw new RequestError(400, `${key} is too long.`);
  }
  return cleaned;
}

function validateMilestones(value, rule) {
  if (!Array.isArray(value) || value.length > rule.max) {
    throw new RequestError(400, "Milestones must be a list of 40 items or fewer.");
  }
  return value.map((item) => {
    if (!isRecord(item)) throw new RequestError(400, "Each milestone must be an object.");
    const extra = Object.keys(item).filter((key) => !["title", "done"].includes(key));
    if (extra.length) throw new RequestError(400, "A milestone contains an unsupported field.");
    return {
      title: validateString(item.title ?? "", "Milestone title", { max: 180 }),
      done: item.done === undefined ? false : item.done,
    };
  }).map((item) => {
    if (typeof item.done !== "boolean") {
      throw new RequestError(400, "Milestone completion must be true or false.");
    }
    return item;
  });
}

function validateResource(resource, input, partial = false) {
  const definition = resourceRules[resource];
  if (!definition) throw new RequestError(404, "This section does not exist.");
  if (!isRecord(input)) throw new RequestError(400, "Send the item as a JSON object.");

  const keys = Object.keys(input);
  const unsupported = keys.filter((key) => !Object.hasOwn(definition.fields, key));
  if (unsupported.length) {
    throw new RequestError(400, `Unsupported field: ${unsupported[0]}.`);
  }

  const output = {};
  for (const [key, rule] of Object.entries(definition.fields)) {
    if (!Object.hasOwn(input, key)) continue;
    const value = input[key];
    if (rule.type === "string") output[key] = validateString(value, key, rule);
    else if (rule.type === "enum") {
      if (!rule.values.includes(value)) {
        throw new RequestError(400, `Choose a valid ${key}.`);
      }
      output[key] = value;
    } else if (rule.type === "boolean") {
      if (typeof value !== "boolean") {
        throw new RequestError(400, `${key} must be true or false.`);
      }
      output[key] = value;
    } else if (rule.type === "stringArray") {
      if (!Array.isArray(value) || value.length > rule.max) {
        throw new RequestError(400, `${key} must be a list of ${rule.max} items or fewer.`);
      }
      output[key] = value.map((item) =>
        validateString(item, key, { max: rule.itemMax }),
      );
    } else if (rule.type === "date") {
      if (value === "" || value === null) output[key] = null;
      else {
        const date = new Date(value);
        if (typeof value !== "string" || Number.isNaN(date.getTime())) {
          throw new RequestError(400, `${key} must be a valid date.`);
        }
        output[key] = date;
      }
    } else if (rule.type === "milestones") {
      output[key] = validateMilestones(value, rule);
    }
  }

  if (!partial) {
    const missing = definition.required.find(
      (key) => !Object.hasOwn(output, key) || output[key] === "",
    );
    if (missing) throw new RequestError(400, `${missing} is required.`);
  }

  return output;
}

const profileFields = {
  fullName: { type: "string", max: 120 },
  photoUrl: { type: "string", max: 1000 },
  email: { type: "string", max: 254 },
  phone: { type: "string", max: 60 },
  location: { type: "string", max: 120 },
  education: {
    degree: { type: "string", max: 160 },
    university: { type: "string", max: 180 },
    graduationYear: { type: "string", max: 12 },
    cgpa: { type: "string", max: 24 },
  },
  professional: {
    summary: { type: "string", max: 3000 },
    careerGoal: { type: "string", max: 300 },
    preferredRoles: { type: "stringArray", max: 20, itemMax: 100 },
    preferredLocations: { type: "stringArray", max: 20, itemMax: 100 },
  },
  social: {
    github: { type: "string", max: 500 },
    linkedin: { type: "string", max: 500 },
    portfolio: { type: "string", max: 500 },
  },
};

function validateProfile(input) {
  if (!isRecord(input)) throw new RequestError(400, "Send profile details as a JSON object.");
  const output = {};
  const unsupported = Object.keys(input).filter((key) => !Object.hasOwn(profileFields, key));
  if (unsupported.length) {
    throw new RequestError(400, `Unsupported field: ${unsupported[0]}.`);
  }

  for (const [key, rule] of Object.entries(profileFields)) {
    if (!Object.hasOwn(input, key)) continue;
    const value = input[key];
    if (typeof rule.type === "string") {
      if (rule.type === "stringArray") {
        if (!Array.isArray(value) || value.length > rule.max) {
          throw new RequestError(400, `${key} must be a list of ${rule.max} items or fewer.`);
        }
        output[key] = value.map((item) =>
          validateString(item, key, { max: rule.itemMax }),
        );
      } else output[key] = validateString(value, key, rule);
      continue;
    }

    if (!isRecord(value)) throw new RequestError(400, `${key} must be an object.`);
    const nested = {};
    const extra = Object.keys(value).filter((field) => !Object.hasOwn(rule, field));
    if (extra.length) throw new RequestError(400, `Unsupported profile field: ${extra[0]}.`);
    for (const [field, nestedRule] of Object.entries(rule)) {
      if (!Object.hasOwn(value, field)) continue;
      if (nestedRule.type === "stringArray") {
        if (!Array.isArray(value[field]) || value[field].length > nestedRule.max) {
          throw new RequestError(400, `${field} must be a list of ${nestedRule.max} items or fewer.`);
        }
        nested[field] = value[field].map((item) =>
          validateString(item, field, { max: nestedRule.itemMax }),
        );
      } else nested[field] = validateString(value[field], field, nestedRule);
    }
    output[key] = nested;
  }
  return output;
}

function flattenPaths(value, prefix = "", output = {}) {
  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(item)) flattenPaths(item, path, output);
    else output[path] = item;
  }
  return output;
}

function idOrNotFound(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new RequestError(404, "This item could not be found.");
  }
}

function toId(value) {
  return value?._id?.toString?.() || value?.id;
}

router.get("/me", async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.account._id });
    res.json({
      user: {
        id: toId(req.account),
        fullName: req.account.fullName,
        email: req.account.email,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.account._id });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.patch("/profile", async (req, res, next) => {
  try {
    const fields = flattenPaths(validateProfile(req.body));
    if (!Object.keys(fields).length) {
      throw new RequestError(400, "Add at least one profile detail before saving.");
    }
    const profile = await Profile.findOneAndUpdate(
      { userId: req.account._id },
      { $set: fields },
      { new: true, runValidators: true },
    );
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const userId = req.account._id;
    const userScope = { userId };
    const [skills, projects, applications, interviewTopics, roadmaps, profile] =
      await Promise.all([
        Skill.countDocuments(userScope),
        Project.countDocuments(userScope),
        JobApplication.find(userScope).select("status company role createdAt").lean(),
        InterviewTopic.countDocuments(userScope),
        Roadmap.find(userScope)
          .select("name goal milestones active createdAt")
          .sort({ createdAt: -1 })
          .lean(),
        Profile.findOne(userScope).lean(),
      ]);

    const applicationStatuses = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const application of applications) {
      if (Object.hasOwn(applicationStatuses, application.status)) {
        applicationStatuses[application.status] += 1;
      }
    }

    const recentActivity = [
      ...(await Skill.find(userScope).select("name createdAt").sort({ createdAt: -1 }).limit(4).lean())
        .map((item) => ({ id: item._id.toString(), message: `Added a skill: ${item.name}`, createdAt: item.createdAt })),
      ...(await Project.find(userScope).select("name createdAt").sort({ createdAt: -1 }).limit(4).lean())
        .map((item) => ({ id: item._id.toString(), message: `Added a project: ${item.name}`, createdAt: item.createdAt })),
      ...applications.map((item) => ({ id: item._id.toString(), message: `Tracking ${item.role} at ${item.company}`, createdAt: item.createdAt })),
      ...roadmaps.map((item) => ({ id: item._id.toString(), message: `Created a roadmap: ${item.name}`, createdAt: item.createdAt })),
    ]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 8);

    const completionFields = [
      profile?.phone,
      profile?.location,
      profile?.education?.degree,
      profile?.education?.university,
      profile?.education?.graduationYear,
      profile?.education?.cgpa,
      profile?.professional?.summary,
      profile?.professional?.careerGoal,
      profile?.professional?.preferredRoles?.length,
      profile?.professional?.preferredLocations?.length,
      profile?.social?.github,
      profile?.social?.linkedin,
      profile?.social?.portfolio,
    ];
    const profileCompletion = Math.round(
      (completionFields.filter((value) => Boolean(value)).length / completionFields.length) * 100,
    );

    res.json({
      counts: {
        skills,
        projects,
        applications: applications.length,
        interviews: applicationStatuses.interview,
        interviewTopics,
        offers: applicationStatuses.offer,
        activeRoadmaps: roadmaps.filter((item) => item.active).length,
      },
      applicationStatuses,
      recentActivity,
      profileCompletion,
      roadmaps: roadmaps.filter((item) => item.active).slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
});

for (const [resource, definition] of Object.entries(resourceRules)) {
  router.get(`/${resource}`, async (req, res, next) => {
    try {
      const items = await definition.model
        .find({ userId: req.account._id })
        .sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  router.post(`/${resource}`, async (req, res, next) => {
    try {
      const fields = validateResource(resource, req.body);
      const item = await definition.model.create({
        ...fields,
        userId: req.account._id,
      });
      await Notification.create({
        userId: req.account._id,
        message: `Added ${definition.label}: ${fields.name || fields.topic || fields.company}`,
      });
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  router.patch(`/${resource}/:id`, async (req, res, next) => {
    try {
      idOrNotFound(req.params.id);
      const fields = validateResource(resource, req.body, true);
      if (!Object.keys(fields).length) {
        throw new RequestError(400, "Add a change before saving.");
      }
      const item = await definition.model.findOneAndUpdate(
        { _id: req.params.id, userId: req.account._id },
        { $set: fields },
        { new: true, runValidators: true },
      );
      if (!item) throw new RequestError(404, "This item could not be found.");
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  router.delete(`/${resource}/:id`, async (req, res, next) => {
    try {
      idOrNotFound(req.params.id);
      const item = await definition.model.findOneAndDelete({
        _id: req.params.id,
        userId: req.account._id,
      });
      if (!item) throw new RequestError(404, "This item could not be found.");
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}

router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.account._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id", async (req, res, next) => {
  try {
    idOrNotFound(req.params.id);
    if (!isRecord(req.body) || Object.keys(req.body).some((key) => key !== "read")) {
      throw new RequestError(400, "Only the read state can be changed.");
    }
    if (typeof req.body.read !== "boolean") {
      throw new RequestError(400, "The read state must be true or false.");
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.account._id },
      { $set: { read: req.body.read } },
      { new: true, runValidators: true },
    );
    if (!notification) throw new RequestError(404, "This notification could not be found.");
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

router.delete("/notifications/:id", async (req, res, next) => {
  try {
    idOrNotFound(req.params.id);
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.account._id,
    });
    if (!notification) throw new RequestError(404, "This notification could not be found.");
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  if (error instanceof RequestError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ error: "Some of those details need another look." });
  }
  return res.status(500).json({ error: "The request could not be completed." });
});

export default router;