import mongoose from "mongoose";

const audienceVoteSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VotingSession",
      required: true,
      index: true,
    },
    voterKey: {
      type: String,
      required: true,
      index: true,
    },
    registrationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    participantName: {
      type: String,
      required: true,
      trim: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    candidateRegistrationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    candidateTeamName: {
      type: String,
      required: true,
      trim: true,
    },
    // Network the vote was cast from — enforces one vote per IP per session
    // and lets the admin purge an abusive IP together with its votes.
    castIp: {
      type: String,
      trim: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// One vote per participant per voting session
audienceVoteSchema.index({ sessionId: 1, voterKey: 1 }, { unique: true });

const AudienceVote = mongoose.model("AudienceVote", audienceVoteSchema);

export default AudienceVote;
