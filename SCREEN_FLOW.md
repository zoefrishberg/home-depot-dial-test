# Screen Flow Map

Map of screens in the Dial Test app. Source of truth: `src/app/App.tsx`.

## High-level flow

```mermaid
flowchart TD
    Start([User lands on app]) --> Init[Initialize session]

    Init --> Intro["intro<br/>DialTestIntro"]

    Intro --> FirstExp["firstExposure<br/>DialTestFirstExposure<br/>(progress 20%)"]
    FirstExp --> HowIt["howItWorks<br/>DialTestHowItWorks<br/>(progress 35%)"]
    HowIt --> HandSel["handSelection<br/>DialTestHandSelection<br/>(progress 50%)"]

    HandSel --> SkipQ{?skipTutorial=true?}
    SkipQ -->|yes| DialTest
    SkipQ -->|no| Tutorial["tutorial<br/>DialTestTutorialSlider<br/>(progress 65%)"]

    Tutorial --> DialTest["dialTest<br/>DialTestSlider<br/>(progress 80%)"]

    DialTest --> Feedback["feedback<br/>FeedbackTypeform<br/>(5 questions)"]

    Feedback --> Complete["complete<br/>Thank-you screen"]
    Complete --> Redirect[Redirect to callback URL<br/>after 2s]
    Redirect --> End([notch.insights.supply/cb])

    Feedback -.onBack.-> DialTest
    HandSel -.onBack.-> HowIt
    HowIt -.onBack.-> FirstExp
    FirstExp -.onBack.-> Intro

    classDef step fill:#E8E8E8,color:#3D3D3D,stroke:#3D3D3D
    classDef terminal fill:#3D3D3D,color:#fff,stroke:#3D3D3D
    class Intro,FirstExp,HowIt,HandSel,Tutorial,DialTest,Feedback step
    class Start,End,Complete,Redirect terminal
```

## Steps and components

| `AppStep`       | Component                | Progress | Notes                                                         |
| --------------- | ------------------------ | -------- | ------------------------------------------------------------- |
| `intro`         | `DialTestIntro`          | —        | Static welcome screen                                         |
| `firstExposure` | `DialTestFirstExposure`  | 20%      | First video viewing, no input required                        |
| `howItWorks`    | `DialTestHowItWorks`     | 35%      | Static explainer of the slider mechanic                       |
| `handSelection` | `DialTestHandSelection`  | 50%      | Captures handedness; persisted to `localStorage['sliderSide']` |
| `tutorial`      | `DialTestTutorialSlider` | 65%      | Slider practice run                                           |
| `dialTest`      | `DialTestSlider`         | 80%      | Recorded slider test                                          |
| `feedback`      | `FeedbackTypeform`       | ~100%    | 5 questions (single-select + text)                            |
| `complete`      | inline thank-you screen  | 100%     | Auto-redirects after 2s                                       |

## URL parameters

| Param          | Values | Effect                                                                                   |
| -------------- | ------ | ---------------------------------------------------------------------------------------- |
| `test`         | `true` | Test mode — nothing is saved to the database                                              |
| `skipTutorial` | `true` | Skip the `tutorial` screen only; flow becomes `… → handSelection → dialTest` |
| `RID`          | any    | Forwarded to callback URL on completion                                                  |

The variant is fixed to `slider` and sent to the backend as such for shape compatibility (`VARIANT` constant in `App.tsx`).

## Feedback questionnaire (`FeedbackTypeform`)

```mermaid
flowchart LR
    Q1[easeOfUse<br/>5 options] --> Q2[attentionDifficulty<br/>4 options]
    Q2 --> Q3[expressiveness<br/>4 options]
    Q3 --> Q4[improvements<br/>free text, optional]
    Q4 --> Q5[repeatIntent<br/>3 options]
    Q5 --> Submit[Submit]
```
