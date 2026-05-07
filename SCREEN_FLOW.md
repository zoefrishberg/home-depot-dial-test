# Screen Flow Map

Complete map of screens and variants in the Dial Test app. Source of truth: `src/app/App.tsx`.

## High-level flow

```mermaid
flowchart TD
    Start([User lands on app]) --> Init[Initialize session]
    Init --> URL{URL params?}

    URL -->|?variant=buttons| VBtn[Variant: buttons]
    URL -->|?variant=slider| VSlider[Variant: slider]
    URL -->|?variant=slider-ratcheted| VRatchet[Variant: slider-ratcheted]
    URL -->|?variant=emotive-buttons| VEmotive[Variant: emotive-buttons]
    URL -->|none| Random{Math.random &lt; 0.5}
    Random -->|true| VBtn
    Random -->|false| VSlider

    VBtn --> Intro
    VSlider --> Intro
    VRatchet --> Intro
    VEmotive --> Intro

    Intro["intro<br/>DialTestIntro"] --> SkipQ{?skipTutorial=true?}
    SkipQ -->|yes| DialTest
    SkipQ -->|no| FirstExp["firstExposure<br/>DialTestFirstExposure<br/>(progress 25%)"]

    FirstExp --> Tutorial{tutorial<br/>by variant}

    Tutorial -->|buttons| TutBtn["DialTestTutorial<br/>(progress 50%)"]
    Tutorial -->|emotive-buttons| TutEmotive["DialTestTutorialEmotiveButtons<br/>(progress 50%)"]
    Tutorial -->|slider| TutSlider["DialTestTutorialSlider<br/>(progress 50%)"]
    Tutorial -->|slider-ratcheted| TutRatchet["DialTestTutorialSliderRatcheted<br/>(progress 50%)"]

    TutBtn --> DialTest
    TutEmotive --> DialTest
    TutSlider --> DialTest
    TutRatchet --> DialTest

    DialTest{dialTest<br/>by variant}
    DialTest -->|buttons| DTBtn["DialTestOption2<br/>(progress 75%)"]
    DialTest -->|emotive-buttons| DTEmotive["DialTestEmotiveButtons<br/>(progress 75%)"]
    DialTest -->|slider| DTSlider["DialTestSlider<br/>(progress 75%)"]
    DialTest -->|slider-ratcheted| DTRatchet["DialTestSliderRatcheted<br/>(progress 75%)"]

    DTBtn --> Feedback
    DTEmotive --> Feedback
    DTSlider --> Feedback
    DTRatchet --> Feedback

    Feedback["feedback<br/>FeedbackTypeform<br/>(5 questions)"] --> Complete

    Complete["complete<br/>Thank-you screen"] --> Redirect[Redirect to callback URL<br/>after 2s]
    Redirect --> End([notch.insights.supply/cb])

    Feedback -.onBack.-> DialTest
    FirstExp -.onBack.-> Intro

    classDef variant fill:#5B9FED,color:#fff,stroke:#3D3D3D
    classDef step fill:#E8E8E8,color:#3D3D3D,stroke:#3D3D3D
    classDef terminal fill:#3D3D3D,color:#fff,stroke:#3D3D3D
    class VBtn,VSlider,VRatchet,VEmotive variant
    class Intro,FirstExp,TutBtn,TutEmotive,TutSlider,TutRatchet,DTBtn,DTEmotive,DTSlider,DTRatchet,Feedback step
    class Start,End,Complete,Redirect terminal
```

## Steps and components

| `AppStep`       | Component(s)                                                                                                  | Progress | Notes                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------- |
| `intro`         | `DialTestIntro`                                                                                               | —        | Static welcome screen                  |
| `firstExposure` | `DialTestFirstExposure`                                                                                       | 25%      | First video viewing, no input required |
| `tutorial`      | `DialTestTutorial` / `DialTestTutorialEmotiveButtons` / `DialTestTutorialSlider` / `DialTestTutorialSliderRatcheted` | 50%      | Variant-specific practice              |
| `dialTest`      | `DialTestOption2` / `DialTestEmotiveButtons` / `DialTestSlider` / `DialTestSliderRatcheted`                   | 75%      | Variant-specific recorded test         |
| `feedback`      | `FeedbackTypeform`                                                                                            | ~100%    | 5 questions (single-select + text)     |
| `complete`      | inline thank-you screen                                                                                       | 100%     | Auto-redirects after 2s                |

## Variants

| `Variant`         | Tutorial                              | Dial Test                  |
| ----------------- | ------------------------------------- | -------------------------- |
| `buttons`         | `DialTestTutorial`                    | `DialTestOption2`          |
| `slider`          | `DialTestTutorialSlider`              | `DialTestSlider`           |
| `slider-ratcheted`| `DialTestTutorialSliderRatcheted`     | `DialTestSliderRatcheted`  |
| `emotive-buttons` | `DialTestTutorialEmotiveButtons`      | `DialTestEmotiveButtons`   |

## URL parameters

| Param          | Values                                                          | Effect                                          |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `variant`      | `buttons` \| `button` \| `slider` \| `slider-ratcheted` \| `emotive-buttons` | Override A/B assignment                         |
| `test`         | `true`                                                          | Test mode — nothing is saved to the database    |
| `skipTutorial` | `true`                                                          | Skip `firstExposure` + `tutorial`, jump to dial test |
| `RID`          | any                                                             | Forwarded to callback URL on completion         |

## Random assignment

When no `variant` URL param is provided, the app randomly assigns `buttons` or `slider` (50/50). `slider-ratcheted` and `emotive-buttons` are only reachable via the URL override.

## Feedback questionnaire (`FeedbackTypeform`)

```mermaid
flowchart LR
    Q1[easeOfUse<br/>5 options] --> Q2[attentionDifficulty<br/>4 options]
    Q2 --> Q3[expressiveness<br/>4 options]
    Q3 --> Q4[improvements<br/>free text, optional]
    Q4 --> Q5[repeatIntent<br/>3 options]
    Q5 --> Submit[Submit]
```

Question wording for `easeOfUse` and `attentionDifficulty` adapts to whether the variant is slider-based or button-based.
