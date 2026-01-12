 # Contributing to GrokInterviews

The following is a set of guidelines for contributing to GrokInterviews. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [GrokInterviews Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for GrokInterviews. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as much detail as possible.
- **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for GrokInterviews, including completely new features and minor improvements to existing functionality.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
- **Provide specific examples to demonstrate the steps**.
- **Describe the current behavior and explain which behavior you expected to see instead** and why.

### Pull Requests

The process described here has several goals:

- Maintain GrokInterviews's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible GrokInterviews
- Enable a sustainable system for GrokInterviews's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1.  Follow all instructions in [the template](.github/PULL_REQUEST_TEMPLATE.md) (if available).
2.  Follow the [styleguides](#styleguides)
3.  After you submit your pull request, verify that all status checks are passing <details><summary>What if the status checks are failing?</summary>If a status check is failing, and you believe that the failure is unrelated to your change, please leave a comment on the pull request explaining why you believe the failure is unrelated. A maintainer will re-run the status check for you. If we conclude that the failure was a false positive, then we will open an issue to track that problem with our status check suite.</details>

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript/TypeScript Styleguide

- All JavaScript must adhere to [Standard JS](https://standardjs.com/).
- Prefer `const` over `let`. Avoid `var`.
- Use correct TypeScript types where possible. Avoid `any`.

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

* `bug` - Issues that are bugs.
* `enhancement` - Issues that are feature requests.
* `documentation` - Improvements or additions to documentation.
* `good first issue` - Good for newcomers.
* `help wanted` - Extra attention is needed.
