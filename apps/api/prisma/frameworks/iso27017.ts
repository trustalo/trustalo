import type { FrameworkDef } from "./index.js";

export const ISO27017_FRAMEWORK: FrameworkDef = {
  name: "ISO/IEC 27017:2015",
  version: "2015",
  description:
    "Code of practice for information security controls based on ISO/IEC 27002 for cloud services",
  frameworkType: "iso27017",
  requirements: [
    {
      identifier: "CLD.6.3.1",
      title: "Shared roles and responsibilities within a cloud computing environment",
      category: "Organization of Information Security",
    },
    {
      identifier: "CLD.8.1.5",
      title: "Removal of cloud service customer assets",
      category: "Asset Management",
    },
    {
      identifier: "CLD.9.5.1",
      title: "Segregation in virtual computing environments",
      category: "Access Control",
    },
    { identifier: "CLD.9.5.2", title: "Virtual machine hardening", category: "Access Control" },
    {
      identifier: "CLD.12.1.5",
      title: "Administrator's operational security",
      category: "Operations Security",
    },
    {
      identifier: "CLD.12.4.5",
      title: "Monitoring of cloud services",
      category: "Operations Security",
    },
    {
      identifier: "CLD.13.1.4",
      title: "Alignment of security management for virtual and physical networks",
      category: "Communications Security",
    },
    {
      identifier: "5.1-ext",
      title: "Information security policies for cloud services",
      category: "Information Security Policies",
    },
    {
      identifier: "6.1-ext",
      title: "Roles and responsibilities for cloud services",
      category: "Organization of Information Security",
    },
    {
      identifier: "9.2-ext",
      title: "User access management for cloud services",
      category: "Access Control",
    },
    {
      identifier: "9.4-ext",
      title: "System and application access control for cloud services",
      category: "Access Control",
    },
    {
      identifier: "10.1-ext",
      title: "Cryptographic controls for cloud services",
      category: "Cryptography",
    },
    {
      identifier: "12.1-ext",
      title: "Operational procedures for cloud services",
      category: "Operations Security",
    },
    {
      identifier: "12.3-ext",
      title: "Information backup for cloud services",
      category: "Operations Security",
    },
    {
      identifier: "12.4-ext",
      title: "Logging and monitoring for cloud services",
      category: "Operations Security",
    },
    {
      identifier: "13.1-ext",
      title: "Network security management for cloud services",
      category: "Communications Security",
    },
    {
      identifier: "18.1-ext",
      title: "Compliance with legal and contractual requirements for cloud services",
      category: "Compliance",
    },
    {
      identifier: "18.2-ext",
      title: "Information security reviews for cloud services",
      category: "Compliance",
    },
  ],
};
