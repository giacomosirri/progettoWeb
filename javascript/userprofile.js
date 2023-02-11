import {createNewPost} from "./commons.js";

function activeMenu(link) {
    const menu = document.querySelectorAll("header nav ul li a");
    menu.forEach(item => item.classList.remove("active"));
    link.classList.add("active");
}

function createBasicInfo(data) {
    const section = document.createElement("section");
    const h1 = document.createElement("h1");
    h1.innerText = data["Name"] + " " + data["Surname"];
    const h2 = document.createElement("h2");
    h2.innerText = "~" + data["Username"];
    const innerDiv = document.createElement("div");
    const img = document.createElement("img");
    img.id = "main-profile-pic";
    img.alt = "profile pic";
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const maxWidth = img.style.maxHeight * aspectRatio;
    img.style.maxWidth = maxWidth.toString();
    getUserProfilePic(data["Username"]).then(image => img.src = image);
    innerDiv.appendChild(img);
    section.appendChild(h1);
    section.appendChild(h2);
    section.appendChild(innerDiv);
    return section;
}

// returns the number of points the user has obtained in the given category
function getPointsFromCategory(stats, category) {
    for (let i=0; i<stats.length; i++) {
        if (stats[i]["Category"] === category) {
            return stats[i]["Points"];
        }
    }
    return 0;
}

function addRatingStats(stats, categories, numOfPosts) {
    const table = document.createElement("table");
    table.id = "rating-statistics";
    table.className = "table table-primary table-bordered table-striped table-hover mb-0";
    table.innerHTML = `
        <caption>Statistics - ${numOfPosts} posts</caption>
        <thead>
            <tr>
                <th>Category</th>
                <th>Points</th>
            </tr>
        </thead>
    `;
    const body = document.createElement("tbody");
    for (let i=0; i < categories.length; i++) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${categories[i]["Name"]}</td>
            <td>${getPointsFromCategory(stats, categories[i]["Name"])}</td>
        `;
        body.appendChild(row);
    }
    table.appendChild(body);
    return table;
}

function createPostFrame() {
    const postFrame = document.createElement("div");
    postFrame.className = "d-flex justify-content-between";
    postFrame.innerHTML = `
        <h2>Most voted post</h2>
        <div class="forward-arrow">
            <a href="../php/posthistory.php?Username=${user}" class="d-flex justify-content-start">
                <p>Browse history</p>
                <div><img class="go-arrow" src="../icons/goarrow_icon.png" alt="browse history"></div>
            </a>
        </div>
    `;
    return postFrame;
}

function createFriendsFrame() {
    const frame = document.createElement("div");
    frame.className = "d-flex justify-content-between";
    frame.innerHTML = `
        <h2>Friends</h2>
        <div class="forward-arrow">
            <a href="../php/friends.php?Username=${user}" class="d-flex justify-content-start">
                <p>See all friends</p>
                <div><img class="go-arrow" src="../icons/goarrow_icon.png" alt="browse history"></div>
            </a>
        </div>
    `;
    return frame;
}

function createFriend(friend) {
    const div = document.createElement("div");
    div.className = "text-center friend";
    const a = document.createElement("a");
    a.href = "../php/userprofile.php?Username=" + friend["Username"];
    const img = document.createElement("img");
    img.alt = friend["Username"] + " profile pic";
    getUserProfilePic(friend["Username"]).then(image => img.src = image);
    const p = document.createElement("p");
    p.innerText = friend["Name"] + " " + friend["Surname"];
    a.appendChild(img);
    a.appendChild(p);
    div.appendChild(a);
    return div;
}

function manageFriendshipStatus(status, friendshipID, requested_user) {
    const div = document.getElementById("friendship-status");
    div.className = "d-flex justify-content-center";
    const p = document.createElement("p");
    p.id = "status";
    if (status === "RECEIVED") {
        p.innerText = user + " has asked for your friendship!";
        div.appendChild(p);
        const accept = createAcceptFriendshipButton(friendshipID, user);
        accept.addEventListener('click', () => reload());
        div.appendChild(accept);
        const reject = createRejectFriendshipButton(friendshipID, user);
        reject.addEventListener('click', () => reload());
        div.appendChild(reject);
    } else if (status === "SENT") {
        p.innerText = "Your have asked " + user + " to become friends! Now you just need to wait for his approval.";
        div.appendChild(p);
    } else if (status === "FRIEND") {
        p.innerText = "You are friend with " + user;
        div.appendChild(p);
        const terminate = createTerminateFriendshipButton(friendshipID, requested_user);
        terminate.addEventListener('click', () => reload());
        div.appendChild(terminate);
    } else {
        const request = createRequestFriendshipButton(session_user, requested_user);
        request.addEventListener('click', () => reload());
        div.appendChild(request);
    }
}

function reload() {
    location.reload();
}

// adds a behavior to the elements of the settings menu in the profile page of the current user
let navItems = Array.from(document.getElementsByClassName("nav-item"));
navItems.forEach(item => item.addEventListener("click", () =>
    item.addEventListener("click", () => activeMenu(item))));

// if this script is part of the profile page, then this variable contains the name of the user currently logged in,
// otherwise it contains the name of the user searched by the user currently logged in.
const user = new URL(window.location.href).searchParams.get("Username") ?? session_user;

axios.get('../php/userprofile-api.php', {params: {Username: user}}).then(response => {
    const numberOfPosts = response.data["user-data"][0]["NumberOfPosts"];
    const numberOfFriends = response.data["user-data"][0]["NumberOfFriends"];
    const userData = createBasicInfo(response.data["user-data"][0]);
    const ratingStats = addRatingStats(response.data["rating-stats"], response.data["categories"], numberOfPosts);
    const friendsNum = (numberOfFriends === 1) ? `${numberOfFriends} friend` : `${numberOfFriends} friends`;
    const signupDate = `Active since ${response.data["user-data"][0]["SignupDate"]}`;
    const header = document.getElementById("user-data");
    const table = document.getElementById("rating-statistics");
    const friends_paragraph = document.getElementById("friends");
    const date_paragraph = document.getElementById("user-since");
    // add friendship status only in pages of users that are not the currently logged-in user.
    if (user !== session_user) {
        getFriendshipStatus(session_user, user).then(data =>
            manageFriendshipStatus(data["status"], data["friendshipID"], data["requested_user"]));
    }
    header.appendChild(userData);
    table.appendChild(ratingStats);
    friends_paragraph.innerHTML = friendsNum;
    date_paragraph.innerHTML = signupDate;
    if (numberOfPosts !== 0) {
        const section = document.getElementById("post");
        section.appendChild(createPostFrame());
        section.appendChild(createNewPost(response.data["most-voted-post"][0]));
    }
    if (numberOfFriends !== 0) {
        const section = document.getElementById("friends-list");
        section.appendChild(createFriendsFrame());
        const div = document.createElement("div");
        div.className = "col-12 d-flex justify-content-start";
        const friends = response.data["friends"];
        for (let i=0; i<Math.min(5, friends.length); i++) {
            div.appendChild(createFriend(friends[i]));
        }
        section.appendChild(div);
    }
});