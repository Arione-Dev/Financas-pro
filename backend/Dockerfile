# Build Stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
VOLUME /tmp
COPY --from=build /app/target/financas-api-0.0.1-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-Xms128m -Xmx384m"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

