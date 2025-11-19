const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["text", "system", "emoji"],
      default: "text"
    }
  },
  { timestamps: true }
);

// Virtual para hora formateada tipo HH:mm:ss
messageSchema.virtual("time").get(function () {
  return this.createdAt.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
});

messageSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Message", messageSchema);
