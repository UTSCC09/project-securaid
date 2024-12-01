function handleReponse(res) {
  if (res.status !== 200) {
    return res.text().then((text) => {
      throw new Error(`${text} (status: ${res.status})`);
    });
  }
  return res.json();
}
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
export function handleSignin(usernameOrEmail, password, fail, success) {
  fetch(`${backendUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrEmail, password }),
    credentials: "include",
  })
    .then(handleReponse)
    .then((data) => success(data.username))
    .catch(fail);
}

export function handleSignup(username, password, email, fail, success) {
  fetch(`${backendUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
    credentials: "include",
  })
    .then(handleReponse)
    .then(() => {
      success({ message: "Sign-Up Successful! Please Log In." });
    })
    .catch(fail);
}

export function handleSignout(success,isGoogleUsed) {
  const google_url = isGoogleUsed ? "/auth/logout" : "/api/logout";
  console.log("---------->" + google_url);
  fetch(`${backendUrl}${google_url}`, {
    method: "GET",
    credentials: "include",
  })
    .then(handleReponse)
    .then(success)
    .catch((error) => console.error("Sign-out error:", error));
}
