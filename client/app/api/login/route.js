
export function getUsername() {
  return document.cookie.replace(
    /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
  );
}

function handleReponse(res) {
  if (res.status != 200) {
    return res.text().then((text) => {
      throw new Error(`${text} (status: ${res.status})`);
    });
  }
  return res.json();
}

// export function signin(username, password, fail, success) {
//   fetch("/signin/", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, password }),
//   })
//     .then(handleReponse)
//     .then(success)
//     .catch(fail);
// }

// export function signup(username, password, fail, success) {
//   fetch("/signup/", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, password }),
//   })
//     .then(handleReponse)
//     .then(success)
//     .catch(fail);
// }

// export async function POST(req) {
//   const { username, password, action } = await req.json();

//   if (action === "signin") {
//     return await handleSignin(username, password);
//   } else if (action === "signup") {
//     return await handleSignup(username, password);
//   } else {
//     return new Response("Invalid action", { status: 400 });
//   }
// }

// async function handleSignin(username, password) {
//   // Logic for handling sign-in (e.g., database validation)
//   return new Response(JSON.stringify({ message: "Sign-in successful" }), {
//     status: 200,
//     headers: { "Content-Type": "application/json" },
//   });
// }

// async function handleSignup(username, password) {
//   // Logic for handling sign-up (e.g., database insert)
//   return new Response(JSON.stringify({ message: "Sign-up successful" }), {
//     status: 200,
//     headers: { "Content-Type": "application/json" },
//   });
// }


export function handleSignin (username, password, fail, success) {
  fetch("http://localhost:4000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
};

export function handleSignup (username, password, fail, success) {
    fetch("http://localhost:4000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
};

// Sign out function
export function handleSignout(success){
    fetch("http://localhost:4000/api/logout/", {
      method: "GET",
      credentials: "include",
    })
    .then(handleReponse)
    .then(success) // Fix this line to call success correctly
    .catch((error) => console.error("Sign-out error:", error));
};

