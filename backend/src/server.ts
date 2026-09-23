import "dotenv/config";
import app from "./app.mjs";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Advest backend running on http://localhost:${PORT}`);
});
