# GitHub Security Setup Instructions

This guide will help you enable all security features for this repository. These steps require **ADMIN** access to the repository.

## 1. Enable Dependabot Alerts

### Via GitHub UI:
1. Go to **Settings** → **Security & analysis**
2. Click **Enable** next to "Dependabot alerts"
3. Click **Enable** next to "Dependabot security updates"

### Via GitHub CLI (requires admin permissions):
```bash
gh api -X PUT repos/avi-boop/rep/vulnerability-alerts
gh api -X PUT repos/avi-boop/rep/automated-security-fixes
```

## 2. Enable Secret Scanning

### For Public Repositories:
Secret scanning is automatically enabled for public repos.

### For Private Repositories (requires GitHub Advanced Security):
1. Go to **Settings** → **Security & analysis**
2. Click **Enable** next to "Secret scanning"
3. Click **Enable** next to "Push protection"

## 3. Enable Code Scanning (CodeQL)

The CodeQL workflow is already configured in `.github/workflows/codeql-analysis.yml`.

To enable:
1. The workflow will run automatically on the next push to main/master
2. Or manually trigger it from **Actions** → **CodeQL Security Scan** → **Run workflow**

## 4. Set Up Branch Protection for Main Branch

### Via GitHub UI:
1. Go to **Settings** → **Branches**
2. Click **Add rule** under "Branch protection rules"
3. Enter branch name pattern: `main` (or `master`)
4. Configure the following settings:

   #### Required Settings:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: **1**
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Add status checks:
       - CodeQL Analysis
       - Dependency Review
       - (Add any other CI checks you have)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Require signed commits** (recommended)
   - ✅ **Require linear history** (recommended)
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict who can push to matching branches**
     - Add administrators and specific users/teams

   #### Additional Security Settings:
   - ✅ **Block force pushes**
   - ✅ **Do not allow deletions**

5. Click **Create** or **Save changes**

### Via GitHub CLI (requires admin permissions):
```bash
gh api -X PUT repos/avi-boop/rep/branches/main/protection \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Analyze (javascript)", "Analyze (python)", "dependency-review"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF
```

## 5. Enable Two-Factor Authentication (2FA)

For repository owners and collaborators:
1. Go to **Settings** → **Password and authentication**
2. Enable **Two-factor authentication**
3. Consider requiring 2FA for all collaborators

## 6. Create CODEOWNERS File

Create `.github/CODEOWNERS` to automatically request reviews:

```
# Global owners
* @avi-boop

# Specific paths
/.github/ @avi-boop
/security/ @avi-boop
```

## 7. Configure Security Advisories

1. Go to **Security** → **Advisories**
2. Click **New draft security advisory** when needed
3. Use this to privately discuss and fix vulnerabilities

## 8. Review and Configure Webhook Events

1. Go to **Settings** → **Webhooks**
2. Ensure webhooks are using HTTPS
3. Use secret tokens for webhook authentication

## Verification Checklist

After completing the setup, verify:

- [ ] Dependabot alerts are enabled
- [ ] Dependabot security updates are enabled
- [ ] Secret scanning is enabled
- [ ] CodeQL workflow runs successfully
- [ ] Main branch has protection rules
- [ ] No branch can bypass protection rules
- [ ] Force pushes are blocked on main
- [ ] Pull requests require reviews
- [ ] Status checks must pass before merging
- [ ] SECURITY.md file is present
- [ ] CODEOWNERS file is configured
- [ ] Team members have 2FA enabled

## Monitoring

Regular security tasks:
- Review Dependabot PRs weekly
- Check security alerts monthly
- Update dependencies quarterly
- Review and rotate secrets/tokens
- Audit collaborator access quarterly

## Additional Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security/getting-started/github-security-features)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
