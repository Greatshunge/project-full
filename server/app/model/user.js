module.exports = (app) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema(
    {
      __v: { type: Number, select: false },
      email: { type: String, require: true },
      passwd: { type: String, require: true, select: false },
      nickname: { type: String, require: true },
      avatar: { type: String, require: false, default: "/user.png" },
      following: {
        type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        default: [],
      },
      likeArticle: {
        type: [{ type: Schema.Types.ObjectId, ref: "Article" }],
        default: [],
      },
      disLikeArticle: {
        type: [{ type: Schema.Types.ObjectId, ref: "Article" }],
        default: [],
      },
    },
    { timestamps: true }
  );
  return mongoose.model("User", UserSchema);
};
