import "dotenv/config";

import { Octokit } from "octokit";
import { request } from "undici";

const repos = [];

/*
  url => string
  mirror => boolean
  repo_name => string
  private => boolean
  description => string
*/

const migrateToGitea = async () => {
  for await (let repo of repos) {
    let { body, statusCode } = await request(
      `http://${process.env.GITEA_URL}/api/v1/repos/migrate`,
      {
        headers: {
          Authorization: `token ${process.env.GITEA_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          clone_addr: repo.url,
          description: repo.description,
          mirror: repo.mirror,
          private: repo.private,
          repo_name: repo.repo_name,
          repo_owner: process.env.GITEA_USER,
          auth_token: process.env.GITHUB_TOKEN,
        }),
      }
    );

    console.log(`${repo.repo_name}: StatusCode ${statusCode}`);
    console.log(await body.text());
  }
};

const main = async () => {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  let response = await octokit.request("GET /user/repos?per_page=100", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  for await (let repo of response.data) {
    repos.push({
      repo_name: repo.name,
      url: repo.html_url,
      mirror: true,
      private: repo.private,
      description: repo.description,
    });
  }
  await migrateToGitea();
};

main();
