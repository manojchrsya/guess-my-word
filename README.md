# guess-my-word
Share your drawing or stories with anyone in real time.
### Todo
* [x] clear html text from chat box.
* [x] assign score after player submit the guess word based on timings.
* [x] fix hard refresh issue on firefox.
* [x] display puzzle to each player after timer completes.
* [x] select random player after timer completes.
* [x] handle users disconnect issue.
* [x] disable drawpad for other than admin.
* [x] poll admin player if admin user get disconnect.
* [x] simplify code base for socket.js server side.
* [x] end game if every player has guess the word exept selected player.
* [x] fix multi user name display in chat box.
* [x] implement round feature.
* [x] added how to play section in landing page.
* [x] save user info in localstorage.
* [x] fix on touch event in canvas.
* [x] implement finish and winner screen.
* [x] fetch word from randomword, display in popup and let user select the word.
* [ ] write test cases.

### Planned improvements

#### Core game loop & product
- [ ] Show rounds left / total rounds and a simple progress indicator.
- [ ] Highlight current drawer with name/avatar ("X is drawing...").
- [ ] Add difficulty tiers for words (easy / medium / hard) and tie to scoring.

#### Word system
- [x] Remove dependency on randomword.com and scraping.
- [x] Load nouns from a local JSON file (fast, no external calls).
- [ ] Expand `src/lib/nouns.json` toward ~1000 curated nouns (tagged by category and difficulty).
- [ ] Add basic word categories (e.g., General / Food / Travel / Tech / Animals / Objects) and allow room admin to choose.

#### Guessing & chat
- [ ] Implement approximate matching for guesses (minor typos still count).
- [ ] Add simple anti-spam: rate-limit guesses and temporary mute for heavy spam.

#### UI / UX
- [ ] Mobile-first UI using Tailwind CSS (high priority).
- [ ] Make layout mobile-first (canvas + chat + status bar that works well on phones).
- [ ] Show word hints (underscores for length, optional letter reveals near timeout).
- [ ] Add a small tutorial overlay for first-time users (draw area, guess input, scores).
- [ ] Improve error messages (room not found, reconnecting, etc.).

#### Social & session flow
- [ ] Add a "Play again with same players" / rematch button after game end.
- [ ] Use lightweight persistent profiles (name + color/avatar via localStorage).

#### Admin controls
- [ ] Simple admin panel: kick player, end game, start new round, change difficulty.
