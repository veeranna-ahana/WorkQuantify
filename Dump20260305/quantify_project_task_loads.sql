-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: quantify
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `project_task_loads`
--

DROP TABLE IF EXISTS `project_task_loads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_task_loads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `role` varchar(100) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `planned_units` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proj_role_task` (`project_id`,`role`,`task_name`),
  CONSTRAINT `project_task_loads_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_task_loads`
--

LOCK TABLES `project_task_loads` WRITE;
/*!40000 ALTER TABLE `project_task_loads` DISABLE KEYS */;
INSERT INTO `project_task_loads` VALUES (11,2,'BA','BA-BRD',1),(12,2,'BA','BA-TDD',1),(13,2,'BA','BA-Requirements Sign Off',1),(14,2,'BE Dev','BEDev-DB Design',20),(15,2,'BE Dev','BEDev-API Impl',220),(16,2,'BE Dev','BEDev-API Testing',200),(17,2,'BE Dev','BEDev-UI Testing',300),(18,2,'BE Dev','BEDev-Documentation',300),(19,2,'BE Dev','BEDev-Design Review',20),(20,2,'BE Dev','BEDev-Code Review',1),(21,2,'BE Dev','BEDev-Release  notes for each build',4),(22,2,'FE Dev','FEDev-UI Impl',300),(23,2,'FE Dev','FEDev-API Design',200),(24,2,'FE Dev','FEDev-API Impl',200),(25,2,'FE Dev','FEDev-API Integration',200),(26,2,'Mobile/IOS Dev','Mobile API Integration',200),(27,2,'Tester','UAT testing',1),(28,2,'Tester','test cases doc preparation',10),(29,2,'Tester','Intergration testing',10),(30,2,'Tester','fault tracker',1),(31,2,'Tester','Traceability Matrix',1),(32,2,'Tester','Aging Report',1),(33,2,'Tester','QA Sign off',1),(34,2,'Tester','User manual preparation',1),(35,2,'TL','TL-Code review',1),(36,2,'TL','TL-Unit Testing',1),(37,2,'TL','TL-Assign Task',1),(38,2,'TL','TL-Peer code merge',1),(39,2,'UI','UI design/ Figma',300),(40,2,'UI','UI Review',300),(41,2,'UI','UI Signoff',1),(104,9,'BA','BA-BRD',10),(105,1,'BA','BA-BRD',1),(106,1,'BA','BA-TDD',1),(107,1,'BA','BA-Requirements Sign Off',1),(108,1,'BE Dev','BEDev-DB Design',1),(109,1,'BE Dev','BEDev-API Impl',200),(111,9,'BA','BA-TDD',10),(114,9,'BA','BA-Requirements Sign Off',1);
/*!40000 ALTER TABLE `project_task_loads` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-08 13:11:31
