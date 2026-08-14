const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const SHA_ENV_NAMES = ["GITHUB_SHA", "COMMIT_SHA"] as const;

type BuildEnvironment = Record<string, string | undefined>;

const normalizeSha = (name: string, value: string): string => {
  if (value !== value.trim()) {
    throw new Error(`${name} must not contain leading or trailing whitespace`);
  }

  if (!SHA_PATTERN.test(value)) {
    throw new Error(`${name} must be a full 40-character hexadecimal Git SHA`);
  }

  return value.toLowerCase();
};

export const resolveBuildSha = ({
  environment,
  checkedOutSha,
}: {
  environment: BuildEnvironment;
  checkedOutSha: string | null;
}): string => {
  const environmentShas = SHA_ENV_NAMES.flatMap((name) => {
    const value = environment[name];
    return value === undefined ? [] : [{ name, sha: normalizeSha(name, value) }];
  });

  const distinctEnvironmentShas = new Set(environmentShas.map(({ sha }) => sha));
  if (distinctEnvironmentShas.size > 1) {
    throw new Error("Build SHA environment variables disagree");
  }

  const environmentSha = environmentShas[0]?.sha ?? null;
  const gitSha = checkedOutSha === null ? null : normalizeSha("checked-out Git SHA", checkedOutSha);

  if (environmentSha && gitSha && environmentSha !== gitSha) {
    throw new Error("Build SHA environment value does not match the checked-out Git commit");
  }

  return environmentSha ?? gitSha ?? "unknown";
};
