import "dotenv/config";
import "./db/index.js";
import { app } from "./app.js";

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`GymFlow API listening on http://localhost:${port}`);
});
