import fs from 'fs';
import path from 'path';

async function runTest() {
  const fetch = (await import('node-fetch')).default;
  const FormData = (await import('form-data')).default;

  console.log("Registering test user...");
  const rand = Math.floor(Math.random() * 100000);
  const registerRes = await fetch("http://localhost:8000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Auto Tester",
      email: `tester${rand}@example.com`,
      password: "password123"
    })
  });

  const registerData = await registerRes.json();
  if (!registerRes.ok) {
    console.error("Registration failed:", registerData);
    return;
  }
  
  const token = registerData.token;
  console.log("Registration successful! Token received.");

  console.log("Uploading avatar...");
  const formData = new FormData();
  formData.append("name", "Auto Tester Updated");
  formData.append("morningMotivation", "true");
  
  const imagePath = "C:\\Users\\bicky\\.gemini\\antigravity-ide\\brain\\5137871d-f3d0-47f7-834f-34c9a50b5f78\\avatar_test_1781020907772.png";
  formData.append("avatar", fs.createReadStream(imagePath));

  const profileRes = await fetch("http://localhost:8000/api/auth/profile", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    console.error("Profile update failed:", profileData);
    return;
  }

  console.log("Profile update successful!");
  console.log("New Avatar URL:", profileData.user.avatarUrl);
  console.log("All tests passed!");
}

runTest().catch(console.error);
