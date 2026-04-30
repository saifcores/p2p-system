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

# Profil render : stockage par défaut sous /app/storage_render (cf.
# application-render.yml). L’utilisateur non-root doit pouvoir écrire ici.
RUN mkdir -p /app/storage_render \
  && chown -R app:app /app

USER app

ENV SPRING_PROFILES_ACTIVE=render

EXPOSE 8080

CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
