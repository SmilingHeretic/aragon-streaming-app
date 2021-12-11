![Aragon-Superfluid logos](assets/Aragon-Superfluid304x117.png)
# Aragon Streaming App

As streaming money becomes the new normal DAOs will naturally lead the way. If the Aragon client handles Superfluid streaming payments then many DAOs can inherit the primitive. 

In our integration we followed the design philosophy of Aragon:
> "...architect apps to do one thing and one thing well and to respect and implement the few aragonOS interfaces"

Our team implemented an app, named *Streaming*, that includes functions to upgrade/downgrade tokens to Super Tokens and manage payment streams. Once installed a DAO will be able to send money over time to its members and other entities. 

## Installation

Use the `dao install` command to install an instance of an app in the DAO.

```sh
dao install <dao-addr> <app-apm-repo> [repo-version]
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-apm-repo`: The repo name of the app being installed (e.g. `voting` or `voting.aragonpm.eth`).
- `repo-version`: (optional) Version of the repo that will be installed; can be a version number or `latest` for the newest published version. Defaults to `latest`.

The `dao install` command will create an instance of the app and assign permissions to the main account to perform all the protected actions in the app.

For more information see the [Aragon CLI docs](https://hack.aragon.org/docs/cli-dao-commands#dao-install).

<!-- Credits? 
[^0]: Collaborated by @SmilingHeretic, @eurvin, @poissonpoivre, @kitblake with help from Superfluid astronauts.
-->
