import bcrypt from "bcrypt";

async function generateHash() {
  const password = "usher123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Generated hash:", hash);
}

generateHash();
