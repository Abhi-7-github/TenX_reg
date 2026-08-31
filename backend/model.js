const mongoose = require("mongoose");

// Define member schema for team members
const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    regNo: {
      type: Number,
      required: [true, "Registration number is required"],
    },
    phoneNo: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
    },
    year: {
      type: String,
      required: [true, "Year is required"],
      enum: {
        values: ["1", "2", "3", "4"],
        message: "Year must be 1st, 2nd, 3rd or 4th year",
      },
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      uppercase: true,
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
    },
    gender: {
      type: String,
      trim: true,
      default: "",
    },
    residenceType: {
      type: String,
      enum: ["hosteler", "dayScholar", ""],
      default: "dayScholar",
    },
    hostelName: {
      type: String,
      trim: true,
      default: "",
    },
    roomNo: {
      type: String,
      trim: true,
      default: "",
    },
    wardenName: {
      type: String,
      trim: true,
      default: "",
    },
    wardenPhoneNo: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

// Define team registration schema
const teamRegistrationSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, "Team name is required"],
    trim: true,
    unique: true,
    minlength: [2, "Team name must be at least 2 characters"],
    maxlength: [50, "Team name must not exceed 50 characters"],
  },
  teamLeader: {
    type: memberSchema,
    required: [true, "Team leader information is required"],
  },
  teamMember1: {
    type: memberSchema,
    required: [true, "Team member 1 information is required"],
  },
  teamMember2: {
    type: memberSchema,
    required: [true, "Team member 2 information is required"],
  },
  teamMember3: {
    type: memberSchema,
    required: [true, "Team member 3 information is required"],
  },
  payment: {
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      trim: true,
      unique: true,
    },
    receiptUrl: {
      type: String,
      required: [true, "Receipt URL is required"],
    },
    receiptFileName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  selectedProblemStatement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProblemStatement",
    default: null,
  },
  selectedProblemSelectedAt: {
    type: Date,
    default: null,
  },
  submissions: {
    type: [
      {
        canvaFigmaLink: { type: String, default: "" },
        note: { type: String, default: "" },
        isSubmitted: { type: Boolean, default: false },
        submittedAt: { type: Date, default: null },
      },
    ],
    default: [],
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the model
const TeamRegistration = mongoose.model(
  "TeamRegistration",
  teamRegistrationSchema,
);

// Define app settings schema for storing configuration
const appSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ["registrationStatus", "maxTeams", "problemStatementsEnabled", "paymentQr"],
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  maxTeams: {
    type: Number,
    default: 50,
  },
  qrUrl: {
    type: String,
    default: "",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const AppSettings = mongoose.model("AppSettings", appSettingsSchema);

// Problem statements for Team Dashboard
const problemStatementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title must not exceed 120 characters"],
    },
    themePng: {
      type: String,
      default: "",
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      minlength: [10, "Short description must be at least 10 characters"],
      maxlength: [600, "Short description must not exceed 600 characters"],
    },
    fullDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Full description must not exceed 5000 characters"],
    },
    slotsTaken: {
      type: Number,
      default: 0,
      min: [0, "slotsTaken cannot be negative"],
    },
    limit: {
      type: Number,
      default: 7,
      min: [1, "Limit must be at least 1"],
    },
  },
  { timestamps: true },
);

const ProblemStatement = mongoose.model(
  "ProblemStatement",
  problemStatementSchema,
);

// Define round marks schema for scoring system
const roundMarksSchema = new mongoose.Schema({
  roundName: {
    type: String,
    required: [true, "Round name is required"],
    trim: true,
    unique: true,
  },
  outOf: {
    type: Number,
    required: [true, "Out of mark is required"],
    min: [1, "Out of mark must be at least 1"],
    default: 100,
  },
  teamMarks: [
    {
      teamName: {
        type: String,
        required: true,
      },
      mark: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RoundMarks = mongoose.model("RoundMarks", roundMarksSchema);

module.exports = {
  TeamRegistration,
  AppSettings,
  ProblemStatement,
  RoundMarks,
};
