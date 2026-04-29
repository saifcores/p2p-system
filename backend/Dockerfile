# Images Debian multi‑plateformes (Alpine maven peut manquer sur arm64).
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build
COPY pom.xml .
COPY src ./src

RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

RUN groupadd --system app \
  && useradd --system --gid app --no-create-home app

COPY --from=build /build/target/p2p-node-1.0.0.jar ./app.jar

RUN chown app:app /app/app.jar

USER app

ENV SPRING_PROFILES_ACTIVE=render

EXPOSE 8080

CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
