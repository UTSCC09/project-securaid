function handleReponse(res) {
  if (res.status !== 200) {
    return res.text().then((text) => {
      throw new Error(`${text} (status: ${res.status})`);
    });
  }
  return res.json();
}

export function handleSignin(usernameOrEmail, password, fail, success) {
  fetch("http://localhost:4000/api/users/login", {
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
  fetch("http://localhost:4000/api/users", {
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

export function handleSignout(success) {
  fetch("http://localhost:4000/api/logout", {
    method: "GET",
    credentials: "include",
  })
    .then(handleReponse)
    .then(success)
    .catch((error) => console.error("Sign-out error:", error));
}
