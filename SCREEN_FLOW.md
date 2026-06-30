# Screen Flow Map

Map of screens in the Dial Test app. Source of truth: `src/app/App.tsx`.

This round (Amazon Texas): 4 videos, each on its own `?video=` slug, fielded
as separate Lucid campaigns. Post-only outcome design — pre-video segmentation
(Age + Gender) AND a post-video block of 8 bipolar sliders. There is no pre/post
pairing and no randomization anywhere. The final save + Lucid completion
redirect fire at the end of the post-video block.

The square `tx-joyride` clip (1:1) and the three 16:9 clips render in the same
container: the `<video>` elements use `object-contain`, so each source is
fit/letterboxed to its own aspect ratio without cropping or stretching.

## High-level flow

```mermaid
flowchart TD
    Start([User lands on app]) --> Init[Initialize session<br/>stores video slug + RID]

    Init --> Intro["intro<br/>DialTestIntro"]

    Intro --> Seg["segmentation<br/>FeedbackTypeform survey=segmentation<br/>(2 pre-video items, 0–20%)"]

    Seg --> FirstExp["firstExposure<br/>DialTestFirstExposure (20%)"]
    FirstExp --> HowIt["howItWorks<br/>DialTestHowItWorks (35%)"]
    HowIt --> HandSel["handSelection<br/>DialTestHandSelection (50%)"]

    HandSel --> SkipQ{?skipTutorial=true?}
    SkipQ -->|yes| DialTest
    SkipQ -->|no| Tutorial["tutorial<br/>DialTestTutorialSlider (65%)"]

    Tutorial --> DialTest["dialTest<br/>DialTestSlider (80%)"]

    DialTest --> Feedback["feedback<br/>FeedbackTypeform survey=postVideo<br/>(8 post-video sliders, 80–100%)"]

    Feedback --> Save[Save post-video answers to feedback row<br/>+ pre-video answers/video/RID to session]
    Save --> Complete["complete<br/>Thank-you screen (100%)"]
    Complete --> Redirect[Redirect after 2s]
    Redirect --> End([notch.insights.supply/cb])

    Seg -.onBack.-> Intro
    FirstExp -.onBack.-> Seg
    HowIt -.onBack.-> FirstExp
    HandSel -.onBack.-> HowIt
    Feedback -.onBack.-> DialTest

    classDef step fill:#E8E8E8,color:#3D3D3D,stroke:#3D3D3D
    classDef terminal fill:#3D3D3D,color:#fff,stroke:#3D3D3D
    class Intro,Seg,FirstExp,HowIt,HandSel,Tutorial,DialTest,Feedback step
    class Start,End,Complete,Redirect,Save,Init terminal
```

## Steps and components

| `AppStep`       | Component                | Progress | Notes                                                                 |
| --------------- | ------------------------ | -------- | --------------------------------------------------------------------- |
| `intro`         | `DialTestIntro`          | —        | Static welcome screen                                                 |
| `segmentation`  | `FeedbackTypeform`       | 0–20%    | 2 pre-video items: Age, Gender (see below)                            |
| `firstExposure` | `DialTestFirstExposure`  | 20%      | First video viewing, no input required                                |
| `howItWorks`    | `DialTestHowItWorks`     | 35%      | Static explainer of the slider mechanic                               |
| `handSelection` | `DialTestHandSelection`  | 50%      | Captures handedness; persisted to `localStorage['sliderSide']`        |
| `tutorial`      | `DialTestTutorialSlider` | 65%      | Slider practice run (skipped with `?skipTutorial=true`)               |
| `dialTest`      | `DialTestSlider`         | 80%      | Recorded slider test; saves dial data, then advances to `feedback`    |
| `feedback`      | `FeedbackTypeform`       | 80–100%  | 8 post-video bipolar sliders (see below); on submit fires final save  |
| `complete`      | inline thank-you screen  | 100%     | Auto-redirects to Lucid after 2s                                      |

## URL parameters

| Param          | Values | Effect                                                                                     |
| -------------- | ------ | ------------------------------------------------------------------------------------------ |
| `video`        | slug   | Selects the clip: `tx-top-down`, `tx-joyride`, `tx-bottom-up-v1`, `tx-bottom-up-v2`. Missing/invalid → `tx-top-down`. |
| `test`         | `true` | Test mode — nothing is saved to the database                                                |
| `skipTutorial` | `true` | Skip the `tutorial` screen only                                                             |
| `RID`          | any    | Stored on the session and forwarded to the Lucid callback URL on completion                |

The variant is fixed to `slider` and sent to the backend as such for shape compatibility (`VARIANT` constant in `App.tsx`).

## Pre-video questions (`FeedbackTypeform`, `survey="segmentation"`)

Same set for all four videos, in this exact order (no randomization). These are
covariates/segments, stored in the segmentation / `preVideoAnswers` blob:

1. `yearOfBirth` (4-digit year) — Age, same input style as prior rounds
2. `gender` (single) — Male, Female, Other

## Post-video questions (`FeedbackTypeform`, `survey="postVideo"`)

8 bipolar sliders, post-only, fixed order (no randomization). Same 8 for all
four videos. Stored in the `feedback:` row (the post-video answers blob),
separate from pre-video answers:

1. `amazonFavorability` — "Please indicate whether you have a favorable or unfavorable opinion of Amazon." Very Unfavorable → Neutral → Very Favorable
2. `amazonPositiveImpactCommunities` — "…Amazon has a positive impact on the communities in which it operates?" Strongly Disagree → Neutral → Strongly Agree
3. `amazonDcBuiltResponsibly` — "…Amazon data centers are built responsibly?" Strongly Disagree → Neutral → Strongly Agree
4. `supportAmazonDcDevelopment` — "Do you support or oppose Amazon data center development in communities across the U.S.?" Strongly Oppose → Neutral → Strongly Support
5. `amazonWaterReplenish` — "How much have you heard about Amazon's goal to replenish more water than its data centers consume?" Nothing at all → Somewhat → A great deal
6. `amazonReducingWater` — "How much have you heard about Amazon reducing the amount of water its data centers use?" Nothing at all → Somewhat → A great deal
7. `amazonEnvironmentalImpact` — "How much have you heard about Amazon's efforts to reduce the environmental impact of its data centers?" Nothing at all → Somewhat → A great deal
8. `regulateAmazon` — "…government should impose new regulations on Amazon data centers?" Strongly Disagree → Neutral → Strongly Agree

Analyst note: the Regulation item (#8) is reverse-valence vs. favorability; a
pro-Amazon respondent lands on the "disagree/left" side. Slider direction is kept
as written; reverse-scoring is handled downstream.

## Data storage (this round)

Per session, in the KV store (`kv_store_640b0dec`, edge function `make-server-640b0dec`):

- `session:{id}` — metadata incl. top-level `video` slug and `rid`; `pages.segmentation.answers` and `pages.completion.preVideoAnswers` both hold the pre-video answers (Age, Gender) — the breakdown covariates.
- `feedback:{id}` — the 8 post-video slider answers plus video metadata fields (the outcome metrics).
- `dialdata:{id}:actual` — recorded dial data points.
