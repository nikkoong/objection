# OBJECTION! — Web version of the not-yet-released party game

Fast-paced courtroom improv game. No accounts needed!

**OBJECTION!** is a fast-paced courtroom improv game that will keep you saying **“OBJECTION!**” long after the gavel is tapped.

Play as a **lawyer**, attempting to manipulate a witness into saying or doing your secret target, and interrupt other players with **OBJECTIONS**. Play as a **witness**, answering questions on your feet and sustaining or dismissing **OBJECTIONS**.

# THE IDEA
* One player is the Witness.
* Everyone else is a Lawyer trying to secretly manipulate the Witness into saying or doing something specific on their secret Target card.
* But the other lawyers can interrupt with **OBJECTIONS** to disrupt questioning and prevent other lawyers from winning first.

# WHAT’S IN THE BOX
## Scenario Cards
Absurd courtroom situations that set the scenario for the round.

Examples:
* “You are accused of stealing 12 penguins from the zoo.”
* “You are an influencer apologizing for selling the product of child slavery.”
* “You accidentally started a small fire during a wedding toast.”
* “You are defending your crypto startup after losing $40 million in investor money.”

## Target Cards
Each Lawyer receives 1 secret target.
Targets may involve:
* saying certain words
* mentioning categories of words
* conversational habits
physical actions

Examples:
* Mention any kind of handheld food
* Mention an animal
* Say “honestly”
* Laugh

## Objection Tokens
Each round, a **Lawyer** receives:
* 2 Objection Tokens
* A token may be spent to call ANY objection.

# SETUP
* Minimum Players: 3
* Recommended: 4-8
* The player in the most trouble with the law becomes the Witness.
* Everyone else becomes Lawyers.

Witness draws 1 Scenario Card.
Each Lawyer draws:
* 1 secret Target Card
* 2 Objection Tokens

*For groups of 5+, set a 4-minute timer and each lawyer gets 4 objection tokens.*

* Set a 2-minute timer.
* The Witness reads the Scenario aloud.
* The round begins immediately.

# HOW TO PLAY
Lawyers question the Witness one at a time clockwise around the table.
A Lawyer may only ask ONE QUESTION before questioning rotates to the next Lawyer.

Example:
* Lawyer A asks a question
* Witness answers
* Lawyer B asks a question
* Witness answers
* Lawyer C asks a question
* etc.

At any moment before the Witness answers, another Lawyer may spend 1 Objection Token and yell:
“OBJECTION!”

The objecting Lawyer must immediately state the objection type:
* Leading
* Relevance
* Vague
* Speculation
* Compound

## The Witness immediately decides:
* SUSTAINED
* DISMISSED

Debate allowed, but timer must be paused.
The Witness should rule quickly and instinctively.

## SUSTAINED VS DISMISSED

### If the objection is SUSTAINED
The turn ends and questioning rotates clockwise to the next Lawyer.

### If the objection is DISMISSED
The objection fails.
The objecting Lawyer immediately loses another Objection Token. For groups of 4 or less, the objecting lawyer now has no tokens.
If they already spent both tokens, nothing further happens.
Then the Witness answers normally.

# WINNING THE ROUND
## Lawyer Victory
If the Witness triggers a Lawyer’s Target Card during that Lawyer’s question:
* the Lawyer immediately reveals the target
* the Lawyer gains 1 point
* the Witness gains 1 point
* the round immediately ends
## Witness Victory
If the Witness survives the full 2-minute (4-minute for larger groups) timer without triggering any targets:
* the Witness gains 2 points

Then rotate roles clockwise and begin the next round.

# WINNING THE GAME
The first player to 5 points wins the game. Or 10, or 20. Whenever you want to stop playing also makes sense.

# THE FIVE OBJECTIONS
## LEADING
“You suggested the answer.”
Example:
“So your favorite food is pizza, right?”

## RELEVANCE
“That has nothing to do with the case.”
Example:
Witness is accused of tax fraud and Lawyer asks: “What kinds of pets do you own?”

## VAGUE
“That question is unclear.”
Example:
“What happened that day?”

## SPECULATION
“You’re asking the witness to guess.”
Example:
“What do you think your neighbor was planning to do?”

## COMPOUND
“That was multiple questions.”
Example:
“Where were you, who were you with, and why were you carrying a shovel?”

---

## SAMPLE ROUND #1
### Scenario
“You are accused of stealing a wedding cake.”
### Target Cards
Lawyer A: Witness says a food
Lawyer B: Witness laughs
Lawyer C: Witness says “honestly”

### Gameplay
Lawyer A:
“What flavor was the cake?”
Witness:
“I don’t remember, but I know it was really good. It was worth getting arrested for.”
Lawyer B:
“Did you ever have improper feelings toward a baker?”
Lawyer A spends 1 Objection Token:
	“OBJECTION! RELEVANCE!”
Witness:
	“Dismissed. I actually did more than just have improper feelings, I was having an affair with the baker of that wedding cake!” (Lawyer A loses last remaining Objection token)
Lawyer C:
	“Did you feel bad about how the cake getting stolen might have ruined the wedding?”
Witness:
	“Honestly, I did. I-”
Lawyer C reveals Target card and round ends. 
Lawyer C gets 1 point and Witness gets 1 point.

## SAMPLE ROUND #2
### Scenario
“You are defending your failed cryptocurrency startup that lost over $40M in investor funding.”
### Target Cards:
Lawyer A: Witness says a number less than 5
Lawyer B: Witness mentions any day of the week
Lawyer C: Witness says the name of any US President

### Gameplay
Lawyer A: 
“How much money was left in your wallet in the aftermath of the bankruptcy?”
Lawyer B spends 1 Objection Token: 
“OBJECTION! LEADING!”
Witness: 
“Dismissed. About 40 million dollars” (Lawyer B loses last remaining Objection token)
Lawyer B:
	“Can you share the details of the day of your bankruptcy filing?”
Witness:
	“It was a really sad day, we didn’t know what was happening until it was already over. We lost everything.”
Lawyer C:
	“Who was President when you first started raising money?”


Lawyer A spends 1 Objection Token:
	“OBJECTION! RELEVANCE!”
Witness:
	“Sustained.” (Questioning moves to Lawyer A)
Lawyer A: 
	“If you were to do it all over again, how would you restart?”
Witness:
	“If I were to go back to day one, I would-”
Lawyer A reveals Target card and round ends. 
Lawyer A gets 1 point and Witness gets 1 point.


# FOR THE WEB VERSION - DEV INSTRUCTIONS
## Quick Start

```bash
npm install
npm run dev
```

- Server runs on http://localhost:3001
- Client runs on http://localhost:5173

Open `http://localhost:5173` on any device on the same network.

> **On mobile:** use your machine's local IP instead of `localhost`  
> e.g. `http://192.168.1.X:5173`

## Adding Scenarios & Targets

Edit the JSON files in `server/config/`:

- `scenarios.json` — courtroom situation strings
- `targets.json` — secret target card strings

No code changes needed. Restart the server after editing.

## Production Build

```bash
npm run build   # builds client to client/dist/
npm start       # serves everything from port 3001
```

Deploy to Railway/Render/Fly.io: set `NODE_ENV=production` and `PORT`.
