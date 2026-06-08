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
-- Table structure for table `assignment_progress`
--

DROP TABLE IF EXISTS `assignment_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_progress` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `assignment_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `units_completed` int NOT NULL DEFAULT '0',
  `remarks` text,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `rejection_reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `assignment_progress_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_progress_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_progress`
--

LOCK TABLES `assignment_progress` WRITE;
/*!40000 ALTER TABLE `assignment_progress` DISABLE KEYS */;
INSERT INTO `assignment_progress` VALUES (1,2,2,'2026-03-02',10,'None','APPROVED',NULL),(6,17,39,'2026-03-02',5,NULL,'APPROVED',NULL),(7,20,39,'2026-03-02',10,NULL,'APPROVED',NULL),(8,21,39,'2026-03-06',1,'None','APPROVED',NULL),(9,23,39,'2026-03-10',50,NULL,'APPROVED',NULL),(10,24,38,'2026-03-10',50,NULL,'APPROVED',NULL),(11,24,38,'2026-03-10',50,NULL,'APPROVED',NULL),(12,22,38,'2026-03-10',1,NULL,'REJECTED','recheck and raise againe'),(13,22,38,'2026-03-10',1,NULL,'APPROVED',NULL),(14,25,38,'2026-04-01',1,'Default','APPROVED',NULL),(15,3,2,'2026-04-09',2,NULL,'APPROVED',NULL),(16,29,2,'2026-05-11',50,'Default','APPROVED',NULL),(17,29,2,'2026-05-11',50,'Delay bcz of master data getting from other team','PENDING',NULL);
/*!40000 ALTER TABLE `assignment_progress` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-08 13:11:29
