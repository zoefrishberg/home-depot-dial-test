# Screen Flow Map

Map of screens in the Dial Test app. Source of truth: `src/app/App.tsx`.

This round ("Good Employer"): 3 videos, each on its own `?video=` slug, fielded
as separate Lucid campaigns. Post-only outcome design — pre-video segmentation
(Age + Gender) AND a post-video block of 10 bipolar sliders. There is no
pre/post pairing and no randomization anywhere. The final save + Lucid
completion redirect fire at the end of the post-video block.

The portrait `sanders-ai-robots` clip and the two 16:9 clips render in the same
container: the `<video>` elements use `object-contain`, so each source is
fit/letterboxed (letterbox/pillarbox) to its own aspect ratio without cropping
or stretching.

Dial instruction copy is Amazon-employer framing this round, shown on both the
`howItWorks` explainer and the live `dialTest` stage (see below).

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

    DialTest --> Feedback["feedback<br/>FeedbackTypeform survey=postVideo<br/>(10 post-video sliders, 80–100%)"]

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
| `dialTest`      | `DialTestSlider`         | 80%      | Recorded slider test; shows the live dial instruction; saves dial data, then advances to `feedback` |
| `feedback`      | `FeedbackTypeform`       | 80–100%  | 10 post-video bipolar sliders (see below); on submit fires final save |
| `complete`      | inline thank-you screen  | 100%     | Auto-redirects to Lucid after 2s                                      |

## URL parameters

| Param          | Values | Effect                                                                                     |
| -------------- | ------ | ------------------------------------------------------------------------------------------ |
| `video`        | slug   | Selects the clip: `sanders-ai-robots`, `amazon-robotic-tech`, `fox-business-robotics`. Missing/invalid → `amazon-robotic-tech`. |
| `test`         | `true` | Test mode — nothing is saved to the database                                                |
| `skipTutorial` | `true` | Skip the `tutorial` screen only                                                             |
| `RID`          | any    | Stored on the session and forwarded to the Lucid callback URL on completion                |

The variant is fixed to `slider` and sent to the backend as such for shape compatibility (`VARIANT` constant in `App.tsx`).

## Pre-video questions (`FeedbackTypeform`, `survey="segmentation"`)

Same set for all three videos, in this exact order (no randomization). These are
covariates/segments, stored in the segmentation / `preVideoAnswers` blob:

1. `yearOfBirth` (4-digit year) — Age, same input style as prior rounds
2. `gender` (single) — Male, Female, Other

## Post-video questions (`FeedbackTypeform`, `survey="postVideo"`)

10 bipolar sliders, post-only, fixed order (no randomization). Same 10 for all
three videos. Every item is oriented negative pole LEFT, positive pole RIGHT.
`centerLabel` is intentionally blank this round (only the two poles are
specified). Stored in the `feedback:` row (the post-video answers blob),
separate from pre-video answers:

1. `good-employer` — "To what extent do you agree or disagree that Amazon is a good employer?" Strongly Disagree → Strongly Agree
2. `brand-favorability` — "Please indicate whether you have a favorable or unfavorable opinion of Amazon." Very unfavorable → Very favorable
3. `purchase-intent` — "Please indicate whether you are likely to purchase from Amazon in the next month." Not At All Likely → Very Likely
4. `amazon-regulation` — "To what extent do you agree or disagree that the government should regulate Amazon more?" Strongly Disagree → Strongly Agree
5. `ai-leader` — "To what extent do you agree or disagree that Amazon is a leader in artificial intelligence?" Strongly Disagree → Strongly Agree
6. `ai-tools-innovator` — "To what extent do you agree or disagree that Amazon is innovating in artificial intelligence tools?" Strongly Disagree → Strongly Agree
7. `bezos-favorability` — "Please indicate whether you have a favorable or unfavorable opinion of Jeff Bezos." Very unfavorable → Very favorable
8. `execs-trust-employees` — "How much do you trust the leadership of Amazon to do the right thing for its employees?" Do not trust at all → Completely trust
9. `preferred-retailer` — "To what extent do you agree or disagree that Amazon is the retailer that I prefer above others?" Strongly Disagree → Strongly Agree
10. `strengthens-america` — "To what extent do you agree or disagree that Amazon is helping to strengthen America?" Strongly Disagree → Strongly Agree

Orientation / analyst notes: #7 (`bezos-favorability`) and #8
(`execs-trust-employees`) are intentionally oriented negative-left /
positive-right — that is the on-screen and stored orientation. #4
(`amazon-regulation`) is reverse-valence vs. favorability; a pro-Amazon
respondent lands on the "disagree/left" side. Slider direction is kept as
written; reverse-scoring is handled downstream.

## Dial instruction copy (this round)

Amazon-employer framing, shown in two places (verbatim):

> As you watch, move the dial to show how the content affects your view of Amazon as an employer. Move it up when your view becomes more positive, and down when it becomes more negative.

- `howItWorks` explainer (`DialTestHowItWorks`, h1) — precedes the practice tutorial.
- Live `dialTest` stage (`DialTestSlider`) — collapsible banner below the header; hides while the dial is actively being dragged.

The practice `tutorial` (`DialTestTutorialSlider`) keeps its own generic warm-up
headline ("Slide up when you feel positive, down when negative"). Center-lock
behavior (handle initializes/locks at center; engagement starts from center) is
unchanged on both the practice and live stages.

## Data storage (this round)

Per session, in the KV store (`kv_store_640b0dec`, edge function `make-server-640b0dec`):

- `session:{id}` — metadata incl. top-level `video` slug and `rid`; `pages.segmentation.answers` and `pages.completion.preVideoAnswers` both hold the pre-video answers (Age, Gender) — the breakdown covariates.
- `feedback:{id}` — the 10 post-video slider answers plus video metadata fields (the outcome metrics), incl. `videoSlug`, `videoRequestedSlug`, `videoUsedFallback`.
- `dialdata:{id}:actual` — recorded dial data points.
