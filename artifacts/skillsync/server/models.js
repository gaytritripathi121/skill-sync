import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

function addPublicId(schema) {
  schema.set("toJSON", {
    transform(_document, value) {
      value.id = value._id.toString();
      delete value._id;
      delete value.__v;
      delete value.userId;
      return value;
    },
  });
}

const userSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { timestamps: true, minimize: false },
);
addPublicId(userSchema);

const profileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    education: {
      degree: { type: String, default: "" },
      university: { type: String, default: "" },
      graduationYear: { type: String, default: "" },
      cgpa: { type: String, default: "" },
    },
    professional: {
      summary: { type: String, default: "" },
      careerGoal: { type: String, default: "" },
      preferredRoles: { type: [String], default: [] },
      preferredLocations: { type: [String], default: [] },
    },
    social: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },
  },
  { timestamps: true, minimize: false },
);
addPublicId(profileSchema);

function ownedSchema(fields) {
  const schema = new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      ...fields,
    },
    { timestamps: true, minimize: false },
  );
  schema.index({ userId: 1, createdAt: -1 });
  addPublicId(schema);
  return schema;
}

const skillSchema = ownedSchema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, default: "", trim: true, maxlength: 80 },
  proficiency: {
    type: String,
    enum: ["beginner", "working", "advanced", "expert"],
    default: "working",
  },
  experience: { type: String, default: "", trim: true, maxlength: 120 },
});

const projectSchema = ownedSchema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  technologies: { type: [String], default: [] },
  demoUrl: { type: String, default: "", trim: true, maxlength: 500 },
  repositoryUrl: { type: String, default: "", trim: true, maxlength: 500 },
});

const applicationSchema = ownedSchema({
  company: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, required: true, trim: true, maxlength: 120 },
  location: { type: String, default: "", trim: true, maxlength: 120 },
  status: {
    type: String,
    enum: ["applied", "screening", "interview", "offer", "rejected"],
    default: "applied",
  },
  appliedAt: { type: Date, default: null },
  jobUrl: { type: String, default: "", trim: true, maxlength: 500 },
  notes: { type: String, default: "", trim: true, maxlength: 3000 },
});

const interviewTopicSchema = ownedSchema({
  topic: { type: String, required: true, trim: true, maxlength: 160 },
  progress: {
    type: String,
    enum: ["not-started", "in-progress", "ready"],
    default: "not-started",
  },
  notes: { type: String, default: "", trim: true, maxlength: 3000 },
});

const milestoneSchema = new Schema(
  {
    title: { type: String, default: "", trim: true, maxlength: 180 },
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const roadmapSchema = ownedSchema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  goal: { type: String, default: "", trim: true, maxlength: 300 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  milestones: { type: [milestoneSchema], default: [] },
  active: { type: Boolean, default: true },
});

const notificationSchema = ownedSchema({
  message: { type: String, required: true, trim: true, maxlength: 240 },
  read: { type: Boolean, default: false },
});

export const User = models.User || model("User", userSchema);
export const Profile = models.Profile || model("Profile", profileSchema);
export const Skill = models.Skill || model("Skill", skillSchema);
export const Project = models.Project || model("Project", projectSchema);
export const JobApplication =
  models.JobApplication || model("JobApplication", applicationSchema);
export const InterviewTopic =
  models.InterviewTopic || model("InterviewTopic", interviewTopicSchema);
export const Roadmap = models.Roadmap || model("Roadmap", roadmapSchema);
export const Notification =
  models.Notification || model("Notification", notificationSchema);