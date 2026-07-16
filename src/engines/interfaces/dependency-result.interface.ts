export interface PackageDependency {
  name: string;
  version: string;
  dev: boolean;
}

export interface DependencyVulnerability {
  id: string;
  summary: string;
  severity?: string;
}

export interface VulnerableDependency {
  name: string;
  version: string;
  vulnerabilities: DependencyVulnerability[];
}

export interface DependencyScanResult {
  vulnerableDependencies: VulnerableDependency[];
}
