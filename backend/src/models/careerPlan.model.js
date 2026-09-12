import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  dueDate: {
    type: Date,
  },
  skills: {
    type: [String],
    default: [],
  },
  resourceType: {
    type: String,
    enum: ["Documentation", "Course", "Quiz", "Interview", "Project", "Other"],
    default: "Documentation",
  },
  resourceRecommendation: {
    type: String,
    default: "",
  },
});

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  phaseNumber: {
    type: Number,
    required: true,
  },
  estimatedWeeks: {
    type: Number,
    default: 2,
  },
  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "in_progress",
  },
  tasks: [taskSchema],
});

const careerPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    targetCompany: {
      type: String,
      default: "Top Tech",
      trim: true,
    },
    targetTimeline: {
      type: String,
      default: "3 Months",
    },
    weeklyCommitmentHours: {
      type: Number,
      default: 10,
    },
    overallReadiness: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    weeklyFocus: {
      type: String,
      default: "Focus on foundational technical skill gaps and hands-on projects.",
    },
    milestones: [milestoneSchema],
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate progress metrics
careerPlanSchema.pre("save", function () {
  let total = 0;
  let completed = 0;

  if (Array.isArray(this.milestones)) {
    this.milestones.forEach((m) => {
      let milestoneAllDone = m.tasks && m.tasks.length > 0;
      if (Array.isArray(m.tasks)) {
        m.tasks.forEach((t) => {
          total++;
          if (t.isCompleted) {
            completed++;
          } else {
            milestoneAllDone = false;
          }
        });
      }
      if (milestoneAllDone) {
        m.status = "completed";
      } else if (m.tasks.some((t) => t.isCompleted)) {
        m.status = "in_progress";
      }
    });
  }

  this.totalTasks = total;
  this.completedTasks = completed;
  this.progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
});

export default mongoose.model("CareerPlan", careerPlanSchema);
