Buffer
======

![Aragon-Superfluid logos](assets/Aragon-Superfluid304x117.png)
# Aragon Streaming App

As streaming money becomes the new normal DAOs will naturally lead the way. If the [Aragon](https://aragon.org/) client handles [Superfluid](https://superfluid.finance/) streaming payments then many DAOs can inherit the primitive.

We integrated Superfluid payment streams following the design philosophy of Aragon:
> "...architect apps to do one thing and one thing well and to respect and implement the few aragonOS interfaces"

Our team[^0] implemented an app, named *Streaming*, that includes functions to upgrade/downgrade tokens to Super Tokens and then manage payment streams. Once installed a DAO will be able to stream money, over time, to its members and other entities.

## Demo Video

View the [Aragon Streaming App demo](https://youtu.be/#) on YouTube.

## How to run locally

```sh
cd streaming
npm install
npm start
```

## Design Sketches

We first made a [design in Figma](https://www.figma.com/file/PBHpbJMYFHCrUeRCWrEHQo/Aragon-DAO-%2B-Super-app?node-id=8%3A2) to be visually consistent and think things thru. 

### Streaming App Overview
![Streaming App Overview](assets/FigmaAppOverview.png)

### Transact Sidebars
![Sliding Sidebars](assets/FigmaSidebars.png)

[^0]: Collaborated by @SmilingHeretic, @eurvin, @poissonpoivre, @kitblake with support from Superfluid astronauts.
<!-- Credits? -->
