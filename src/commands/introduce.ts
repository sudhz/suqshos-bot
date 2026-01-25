import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  LabelBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { GENDERS } from "../types";

export const MODAL_ID = "introduction-modal";

export const data = new SlashCommandBuilder()
  .setName("introduce")
  .setDescription("Introduce yourself to the community");

export function getModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle("Introduce Yourself");

  const nameInput = new TextInputBuilder()
    .setCustomId("name")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Your name")
    .setRequired(true)
    .setMaxLength(50);

  const ageInput = new TextInputBuilder()
    .setCustomId("age")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Your age")
    .setRequired(true)
    .setMaxLength(3);

  const genderOptions = GENDERS.map((gender) =>
    new StringSelectMenuOptionBuilder().setLabel(gender).setValue(gender)
  );

  const genderSelect = new StringSelectMenuBuilder()
    .setCustomId("gender")
    .setPlaceholder("Select your gender")
    .setRequired(true)
    .addOptions(genderOptions);

  const locationInput = new TextInputBuilder()
    .setCustomId("location")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("City, Country")
    .setRequired(true)
    .setMaxLength(100);

  const aboutInput = new TextInputBuilder()
    .setCustomId("about")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Tell us about your interests, hobbies, what you enjoy...")
    .setRequired(false)
    .setMaxLength(500);

  modal.addLabelComponents(
    new LabelBuilder().setLabel("Name").setTextInputComponent(nameInput),
    new LabelBuilder().setLabel("Age").setTextInputComponent(ageInput),
    new LabelBuilder().setLabel("Gender").setStringSelectMenuComponent(genderSelect),
    new LabelBuilder().setLabel("Location").setTextInputComponent(locationInput),
    new LabelBuilder()
      .setLabel("About Yourself")
      .setDescription("Your interests, hobbies, what you enjoy...")
      .setTextInputComponent(aboutInput)
  );

  return modal;
}
