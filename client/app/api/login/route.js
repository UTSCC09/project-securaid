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

export function signin(username, password, fail, success) {
  fetch("/signin/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function signup(username, password, fail, success) {
  fetch("/signup/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}
