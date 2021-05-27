module.exports = (app) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ArticleSchema = new Schema(
    {
      __v: { type: Number, select: false },
      title: { type: String, required: true },
      article: { type: String, required: true, select: false },
      article_html: { type: String, required: true },
      author: { type: Schema.Types.ObjectId, ref: "User", required: true },
      views: {
        type: Number,
        required: true,
        default: 1,
      },
      like: {
        type: Number,
        required: true,
        default: 0,
      },
      dislike: { type: Number, required: false, default: 0 },
    },
    { timestamps: true }
  );
  return mongoose.model("Article", ArticleSchema);
};
